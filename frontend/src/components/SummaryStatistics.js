import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../config';

const SummaryStatistics = forwardRef(({ email, task }, ref) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!email || !task) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/statistics?email=${encodeURIComponent(email)}&task=${encodeURIComponent(task)}`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Failed to load statistics');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [email, task]);

  useImperativeHandle(ref, () => ({
    refreshData: fetchStats
  }));

  if (loading) {
    return (
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No statistics available yet</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom align="center">
        Summary Statistics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: 2
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" gutterBottom>
                Totals
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Today:</Typography>
                <Typography fontWeight="bold">{stats.today_total}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>This Week:</Typography>
                <Typography fontWeight="bold">{stats.week_total}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>This Month:</Typography>
                <Typography fontWeight="bold">{stats.month_total}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>All Time:</Typography>
                <Typography fontWeight="bold">{stats.all_time_total}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              This Week's Activity
            </Typography>
            <Box sx={{ height: 200, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.week_data} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value) => [`${value} entries`, 'Count']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#7B1FA2" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
});

export default SummaryStatistics;