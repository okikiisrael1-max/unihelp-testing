import { useState, useEffect } from 'react';
import axios from 'axios';

// Cache to prevent refetching multiple times when switching between pages
let cachedFormulas = null;

export const useFormulas = () => {
  const [formulas, setFormulas] = useState(cachedFormulas || []);
  const [loading, setLoading] = useState(!cachedFormulas);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedFormulas) {
      setFormulas(cachedFormulas);
      setLoading(false);
      return;
    }

    const fetchFormulas = async () => {
      try {
        const response = await axios.get('https://unihelp-backend-vdps.onrender.com/api/formulas');
        cachedFormulas = response.data.formulas || response.data;
        // In case the API wraps it in an object like { success: true, formulas: [...] } 
        // we check response.data.formulas or fallback to response.data
        setFormulas(cachedFormulas);
      } catch (err) {
        console.error('Failed to fetch formulas:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFormulas();
  }, []);

  return { formulas, loading, error };
};
