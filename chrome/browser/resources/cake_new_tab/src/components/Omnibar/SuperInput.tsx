// import React, { useRef, useEffect, useState } from 'react';

// const SuperInput = ({ onSubmit, placeholder }) => {
//   const [lines, setLines] = useState(['']);
//   const inputRef = useRef(null);

//   useEffect(() => {
//     if (inputRef.current) {
//       inputRef.current.focus();
//     }
//   }, []);

//   const handleKeyDown = (event) => {
//     if (event.key === 'Enter') {
//       event.preventDefault();
//       if (event.shiftKey) {
//         // Add a new line
//         setLines((prevLines) => [...prevLines, '']);
//       } else {
//         // Trigger submit function
//         onSubmit(lines.join('\n'));
//       }
//     } else if (event.key === 'Backspace') {
//       // Handle backspace to remove empty lines
//       setLines((prevLines) => {
//         const newLines = [...prevLines];
//         if (newLines[newLines.length - 1] === '') {
//           newLines.pop();
//         }
//         return newLines;
//       });
//     }
//   };

//   const handleInput = (event) => {
//     const { innerText } = event.target;
//     setLines(innerText.split('\n'));
//   };

//   return (
//     <div
//       ref={inputRef}
//       contentEditable
//       onKeyDown={handleKeyDown}
//       onInput={handleInput}
//       style={{
//         overflowWrap: 'break-word',
//         whiteSpace: 'break-spaces',
//         border: '1px solid #ccc',
//         padding: '8px',
//         minHeight: '40px',
//         outline: 'none',
//       }}
//       placeholder={placeholder}
//     >
//       {lines.map((line, index) => (
//         <p key={index} style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
//           {line}
//         </p>
//       ))}
//       {lines.length === 1 && lines[0] === '' && <span style={{ color: '#aaa' }}>{placeholder}</span>}
//     </div>
//   );
// };

// export default SuperInput;
