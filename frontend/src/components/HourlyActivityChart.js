import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { API_BASE_URL } from '../config';

const HourlyActivityChart = forwardRef(({ email, task }, ref) => {
  const [hourlyData, setHourlyData] = useState(Array(24).fill(0));

  const fetchHourlyData = async () => {
    if (!email || !task) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hourly_activity?email=${encodeURIComponent(email)}&task=${encodeURIComponent(task)}`
      );
      if (response.ok) {
        const data = await response.json();
        setHourlyData(data.hourly_activity);
      } else {
        console.error('Failed to fetch hourly data');
        setHourlyData(Array(24).fill(0));
      }
    } catch (error) {
      console.error('Error fetching hourly data:', error);
      setHourlyData(Array(24).fill(0));
    }
  };

  useEffect(() => {
    fetchHourlyData();
  }, [email, task]);

  useImperativeHandle(ref, () => ({
    refreshData: fetchHourlyData
  }));

  const getColor = (count) => {
    if (count === 0) return '#424242';
    const intensity = Math.min(0.3 + count * 0.2, 1);
    return `rgba(123, 31, 162, ${intensity})`; // Using primary color from theme
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Typography variant="h6" gutterBottom align="center">
        Today's Activity
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        {hourlyData.map((count, index) => (
          <Tooltip 
            key={index} 
            title={`${index}:00 - ${count} ${count === 1 ? 'entry' : 'entries'}`} 
            arrow
          >
            <Box
              sx={{
                width: 12,
                height: 40,
                backgroundColor: getColor(count),
                borderRadius: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  cursor: 'pointer'
                },
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          px: 1,
          overflowX: 'auto'
        }}
      >
        {Array.from({ length: 24 }, (_, i) => (
          <Typography 
            key={i} 
            variant="caption" 
            sx={{ 
              minWidth: 20, 
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            {i}
          </Typography>
        ))}
      </Box>
    </Box>
  );
});

export default HourlyActivityChart;