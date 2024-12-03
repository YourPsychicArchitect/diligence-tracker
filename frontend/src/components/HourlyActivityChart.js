import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography } from '@mui/material';
import { API_BASE_URL } from '../config';

const HourlyActivityChart = forwardRef(({ email, task }, ref) => {
  const [hourlyData, setHourlyData] = useState([]);

  const fetchHourlyData = useCallback(async () => {
    if (!email || !task) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/hourly_activity?email=${encodeURIComponent(email)}&task=${encodeURIComponent(task)}`);
      if (response.ok) {
        const data = await response.json();
        setHourlyData(data.hourly_activity);
      } else {
        throw new Error('Failed to fetch hourly data');
      }
    } catch (error) {
      console.error('Error fetching hourly data:', error);
    }
  }, [email, task]);

  // Expose the refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshData: fetchHourlyData
  }));

  useEffect(() => {
    fetchHourlyData();
  }, [fetchHourlyData]);

  return (
    <Box sx={{ width: '100%', mt: 6, mb: 4 }}>
      <Typography variant="h6" gutterBottom align="center">Today's Activity</Typography>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        px: { xs: 1, sm: 2, md: 3 }
      }}>
        {/* Activity bars */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(24, 1fr)',
          gap: '2px',
          mb: 1
        }}>
          {hourlyData.map((count, index) => (
            <Box
              key={index}
              sx={{
                height: 24,
                backgroundColor: count > 0 ? 'primary.main' : 'grey.700',
                opacity: count > 0 ? Math.min(0.3 + count * 0.1, 1) : 0.3,
                borderRadius: '4px',
                position: 'relative',
                '&:hover::after': {
                  content: `"Hour ${index}: ${count} entries"`,
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  zIndex: 1
                }
              }}
            />
          ))}
        </Box>
        
        {/* Hour labels */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(24, 1fr)',
          gap: '2px'
        }}>
          {Array.from({ length: 24 }, (_, i) => (
            <Typography
              key={i}
              variant="caption"
              sx={{
                textAlign: 'center',
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                transform: { xs: 'rotate(-45deg)', sm: 'none' },
                transformOrigin: 'center',
                height: { xs: '20px', sm: 'auto' }
              }}
            >
              {i}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
});

export default HourlyActivityChart;