import { useEffect } from 'react';

export default function Crash() {
  useEffect(() => {
    throw { message: 'Test crash' };
  }, []);

  return <div></div>;
}
