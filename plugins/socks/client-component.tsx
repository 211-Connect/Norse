'use client';
import { useState } from 'react';

export default function ClientComponent() {
  const [counter, setCounter] = useState(0);

  return (
    <div>
      {counter}
      <button
        onClick={() => {
          setCounter((prev) => prev + 1);
        }}
      >
        +
      </button>
    </div>
  );
}
