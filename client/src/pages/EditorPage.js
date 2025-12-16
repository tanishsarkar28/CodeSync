import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    
    // States
    const [clients, setClients] = useState([]);
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSocketReady, setIsSocketReady] = useState(false);
    
    // --- NEW: Language State ---
    const [language, setLanguage] = useState('c++'); // Default C++

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            setIsSocketReady(true); 

            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit('join', {
                roomId,
                username: location.state?.username,
            });

            socketRef.current.on('joined', ({ clients, username, socketId }) => {
                if (username !== location.state?.username) {
                    toast.success(`${username} joined the room.`);
                }
                setClients(clients);
                
                socketRef.current.emit('sync-code', {
                    code: codeRef.current,
                    socketId,
                });
            });

            socketRef.current.on('disconnected', ({ socketId, username }) => {
                toast.success(`${username} left the room.`);
                setClients((prev) => prev.filter((client) => client.socketId !== socketId));
            });
        };
        init();

        return () => {
            if(socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off('joined');
                socketRef.current.off('disconnected');
            }
        };
    }, []);

    const runCode = async () => {
        setLoading(true);
        try {
            const { data } = await axios.post(`${process.env.REACT_APP_BACKEND_URL || http://localhost:5000/compile', {
                code: codeRef.current,
                language: language // --- Send selected language ---
            });
            const result = data.run ? data.run.output : data.message || "Error executing code";
            setOutput(result);
        } catch (error) {
            console.error(error);
            toast.error('Failed to compile code');
            setOutput('Error connecting to server...');
        } finally {
            setLoading(false);
        }
    };

    // --- Language Change Handler ---
    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
        // Optional: Aap chahein to default boiler plate code bhi set kar sakte hain yahan
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap" style={{display: 'flex', height: '100vh', background: '#1c1e29'}}>
            
            {/* SIDEBAR */}
            <div className="aside" style={{width: '250px', background: '#0d1117', color: 'white', display: 'flex', flexDirection: 'column', padding: '20px', borderRight: '1px solid #30363d'}}>
                <div className="asideInner" style={{flex: 1}}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'25px', paddingBottom:'15px', borderBottom:'1px solid #30363d'}}>
                        <img src="/logo192.png" alt="logo" style={{height:'35px'}}/> 
                        <span style={{fontWeight:'700', fontSize:'20px', letterSpacing:'1px'}}>CodeSync</span>
                    </div>
                    
                    <h3 style={{fontSize:'14px', textTransform:'uppercase', color:'#8b949e', marginBottom:'15px'}}>Active Members</h3>
                    <div className="clientsList" style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                        {Array.from(new Set(clients.map(client => client.username)))
                            .map((username) => {
                                const client = clients.find(c => c.username === username);
                                return (
                                    <div key={client.socketId} style={{display: 'flex', alignItems: 'center', background: '#161b22', padding: '10px', borderRadius: '8px', border: '1px solid #30363d'}}>
                                        <span style={{width:'32px', height:'32px', borderRadius:'6px', background:'#238636', color:'white', display:'flex', alignItems:'center', justifyContent:'center', marginRight:'12px', fontSize:'14px', fontWeight:'bold'}}>
                                            {client.username.charAt(0).toUpperCase()}
                                        </span>
                                        <span style={{fontWeight:'500'}}>{client.username}</span>
                                    </div>
                                );
                        })}
                    </div>
                </div>
                
                <button className="btn" onClick={() => {
                    navigator.clipboard.writeText(roomId);
                    toast.success('Room ID copied!');
                }} style={{width: '100%', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginBottom: '12px', background: '#f0f6fc', color: '#0d1117', fontWeight: '600'}}>
                    Copy Room ID
                </button>
                <button className="btn" onClick={() => reactNavigator('/')} style={{width: '100%', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#da3633', color: 'white', fontWeight: '600'}}>
                    Leave Room
                </button>
            </div>

            {/* EDITOR AREA */}
            <div className="editorWrap" style={{flex: 1, display: 'flex', flexDirection: 'column', height: '100vh'}}>
                
                {/* Navbar with Language Selector */}
                <div style={{height: '60px', background: '#0d1117', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #30363d', justifyContent: 'space-between'}}>
                    
                    {/* --- NEW: Language Selector --- */}
                    <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                        <span style={{color: '#8b949e', fontSize: '14px', fontWeight: 'bold'}}>Language:</span>
                        <select 
                            onChange={handleLanguageChange} 
                            value={language}
                            style={{
                                padding: '8px', 
                                borderRadius: '5px', 
                                background: '#21262d', 
                                color: 'white', 
                                border: '1px solid #30363d', 
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            <option value="c++">C++</option>
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                            <option value="c">C</option>
                        </select>
                    </div>

                    <button 
                        onClick={runCode} 
                        disabled={loading}
                        className="btn"
                        style={{
                            padding: '10px 25px', 
                            borderRadius: '5px', 
                            border: 'none', 
                            cursor: loading ? 'not-allowed' : 'pointer', 
                            background: loading ? '#21262d' : '#238636', 
                            color: 'white', 
                            fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                        {loading ? 'Compiling...' : 'Run Code ▶'}
                    </button>
                </div>

                {/* Code Editor */}
                <div style={{flex: 1, overflow: 'hidden', background: '#282a36'}}>
                    {isSocketReady && <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        languageOption={language} // --- Pass language prop ---
                        onCodeChange={(code) => {
                            codeRef.current = code;
                        }}
                    />}
                </div>

                {/* Output Window */}
                <div style={{
                    height: '25vh', 
                    background: '#0d1117', 
                    borderTop: '2px solid #30363d', 
                    display: 'flex', 
                    flexDirection: 'column'
                }}>
                    <div style={{padding: '8px 20px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: '12px', fontWeight: 'bold', color: '#8b949e', textTransform: 'uppercase'}}>
                        Output Console
                    </div>
                    <div style={{flex: 1, padding: '15px', overflowY: 'auto', fontFamily: "'Fira Code', monospace", fontSize: '14px', color: '#c9d1d9'}}>
                        <pre style={{margin: 0, whiteSpace: 'pre-wrap', color: output.includes('Error') ? '#ff7b72' : '#c9d1d9'}}>
                            {output || 'Click "Run Code" to see output here...'}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;