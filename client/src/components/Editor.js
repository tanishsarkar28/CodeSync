import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python'; // Python support
import 'codemirror/mode/clike/clike';   // C, C++, Java support
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';

// Props mein 'languageOption' add kiya
const Editor = ({ socketRef, roomId, onCodeChange, languageOption }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        async function init() {
            if (editorRef.current) return;

            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'javascript', json: true }, // Default
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                
                if (origin !== 'setValue') {
                    if (socketRef && socketRef.current) {
                        socketRef.current.emit('code-change', {
                            roomId,
                            code,
                        });
                    }
                }
            });
        }
        init();
    }, []);

    // Jab Language change ho, tab Editor ka mode badal do
    useEffect(() => {
        if (editorRef.current) {
            // Mapping dropdown value to CodeMirror modes
            let mode = 'javascript';
            if (languageOption === 'python') mode = 'python';
            if (languageOption === 'java') mode = 'text/x-java';
            if (languageOption === 'c++') mode = 'text/x-c++src';
            if (languageOption === 'c') mode = 'text/x-csrc';

            editorRef.current.setOption('mode', mode);
        }
    }, [languageOption]);

    useEffect(() => {
        if (socketRef && socketRef.current) {
            socketRef.current.on('code-change', ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }
        return () => {
            if (socketRef && socketRef.current) {
                socketRef.current.off('code-change');
            }
        };
    }, [socketRef.current]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;