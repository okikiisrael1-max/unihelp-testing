import { useState, useEffect } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'https://unihelp-backend-vdps.onrender.com').replace(/\/$/, '');

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
        const response = await fetch(`${API_URL}/api/formulas`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || payload?.message || 'Failed to fetch formulas');
        }

        const data = Array.isArray(payload) ? payload : payload.formulas || payload.data || [];
        cachedFormulas = data;
        setFormulas(data);
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
