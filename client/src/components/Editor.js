import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';

const Editor = ({ socketRef, roomId, onCodeChange, languageOption }) => {
    const editorRef = useRef(null);
    // Saare remote cursors (markers) ko store karne ke liye
    const markersRef = useRef({}); 

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

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                if (origin !== 'setValue') {
                    socketRef.current.emit('code-change', { roomId, code });
                }
            });

            // --- 1. NEW: Cursor Move Event Listener ---
            // Jab hum apna cursor hilayein, server ko batao
            editorRef.current.on('cursorActivity', (instance) => {
                const cursor = instance.getCursor(); // { line: 1, ch: 5 }
                socketRef.current.emit('cursor-change', {
                    roomId,
                    cursor
                });
            });
        }
        init();
    }, []);

    // Handle Language Change
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

    // Handle Socket Events (Code & Cursor)
    useEffect(() => {
        if (socketRef.current) {
            // Code Change Handle
            socketRef.current.on('code-change', ({ code }) => {
                if (code !== null && editorRef.current) {
                    const currentCode = editorRef.current.getValue();
                    if (code !== currentCode) {
                        const cursor = editorRef.current.getCursor();
                        const scrollInfo = editorRef.current.getScrollInfo();
                        editorRef.current.setValue(code);
                        editorRef.current.setCursor(cursor);
                        editorRef.current.scrollTo(scrollInfo.left, scrollInfo.top);
                    }
                }
            });

            // --- 2. NEW: Cursor Update Handle ---
            socketRef.current.on('cursor-update', ({ socketId, cursor, username }) => {
                if (editorRef.current) {
                    
                    // Agar purana cursor marker hai toh hatao
                    if (markersRef.current[socketId]) {
                        markersRef.current[socketId].clear();
                    }

                    // Cursor Element Banao (DOM Manipulation)
                    const cursorElement = document.createElement('div');
                    cursorElement.classList.add('remote-cursor');
                    cursorElement.style.borderLeftColor = getRandomColor(socketId); // Random color

                    // Name Tag Element
                    const tooltip = document.createElement('div');
                    tooltip.classList.add('remote-cursor-tooltip');
                    tooltip.innerText = username;
                    tooltip.style.backgroundColor = getRandomColor(socketId);

                    cursorElement.appendChild(tooltip);

                    // CodeMirror pe Bookmark set karo
                    markersRef.current[socketId] = editorRef.current.setBookmark(cursor, {
                        widget: cursorElement,
                        insertLeft: true,
                    });
                }
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off('code-change');
                socketRef.current.off('cursor-update');
            }
        };
    }, [socketRef.current]);

    // Helper: Random Color Generator (Hash of socketId)
    const getRandomColor = (id) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00ffffff).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;