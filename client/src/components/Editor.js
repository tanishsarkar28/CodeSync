import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python'; // Python support
import 'codemirror/mode/clike/clike';   // C, C++, Java support
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';

const Editor = ({ socketRef, roomId, onCodeChange, languageOption }) => {
    const editorRef = useRef(null);

    // 1. Editor Initialize karna
    useEffect(() => {
        async function init() {
            if (editorRef.current) return;

            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            // Local Change Handler
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                
                // Agar humne type kiya hai, toh server ko bhejo
                // 'setValue' tab hota hai jab server se code aata hai (usko wapas server nahi bhejna)
                if (origin !== 'setValue') {
                    socketRef.current.emit('code-change', {
                        roomId,
                        code,
                    });
                }
            });
        }
        init();
    }, []);

    // 2. Language Change Handle karna
    useEffect(() => {
        if (editorRef.current) {
            let mode = 'javascript';
            if (languageOption === 'python') mode = 'python';
            if (languageOption === 'java') mode = 'text/x-java';
            if (languageOption === 'c++') mode = 'text/x-c++src';
            if (languageOption === 'c') mode = 'text/x-csrc';

            editorRef.current.setOption('mode', mode);
        }
    }, [languageOption]);

    // 3. Socket se Code Receive karna (Cursor Jumping Fix)
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('code-change', ({ code }) => {
                if (code !== null && editorRef.current) {
                    
                    const currentCode = editorRef.current.getValue();
                    
                    // Agar naya code purane se alag hai, tabhi update karein
                    if (code !== currentCode) {
                        // A. Cursor aur Scroll ki position save karo
                        const cursor = editorRef.current.getCursor();
                        const scrollInfo = editorRef.current.getScrollInfo();

                        // B. Value update karo
                        editorRef.current.setValue(code);

                        // C. Cursor aur Scroll wapas wahin set karo
                        editorRef.current.setCursor(cursor);
                        editorRef.current.scrollTo(scrollInfo.left, scrollInfo.top);
                    }
                }
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off('code-change');
            }
        };
    }, [socketRef.current]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;