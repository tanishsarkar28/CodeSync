import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new room');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('ROOM ID & username is required');
            return;
        }
        // Redirect to Editor Page
        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="homePageWrapper" style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#1c1e29', color:'#fff'}}>
            <div className="formWrapper" style={{background:'#282a36', padding:'20px', borderRadius:'10px', width:'400px'}}>
                <h4 className="mainLabel">Paste invitation ROOM ID</h4>
                <div className="inputGroup">
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="ROOM ID"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                        style={{width:'90%', padding:'10px', marginBottom:'10px', borderRadius:'5px', border:'none'}}
                    />
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="USERNAME"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        onKeyUp={handleInputEnter}
                        style={{width:'90%', padding:'10px', marginBottom:'10px', borderRadius:'5px', border:'none'}}
                    />
                    <button className="btn joinBtn" onClick={joinRoom} style={{background:'#4aed88', border:'none', padding:'10px 20px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>Join</button>
                    <span className="createInfo" style={{display:'block', marginTop:'10px'}}>
                        If you don't have an invite then create &nbsp;
                        <a onClick={createNewRoom} href="" className="createNewBtn" style={{color:'#4aed88', textDecoration:'none', fontWeight:'bold'}}>new room</a>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Home;