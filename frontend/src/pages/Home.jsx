import React, { useState, useEffect } from 'react';
/**
 * 
 * REMOVE ALL OF THIS AND CREATE THE PAGES AS NEEDED. This was just for testing -  💘 Amzal
 * 
 * I jsut wanted see my beautiful stuff in vercel 😂😂😂😂
 */
const Home = () => {
  const [data, setData] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/inventory`);
        const result = await response.json();
        setData(result);
        console.log(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [API_URL]);

  return (
    <>
      <div>Home</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

export default Home;
