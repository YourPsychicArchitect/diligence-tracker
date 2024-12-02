import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { API_BASE_URL } from '../config';

const TimezoneSelector = ({ email }) => {
  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem('userTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  // Get list of all timezones
  const timezones = Intl.supportedValuesOf('timeZone').sort();

  useEffect(() => {
    const fetchUserTimezone = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/get_timezone?email=${encodeURIComponent(email)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.timezone) {
            setTimezone(data.timezone);
            localStorage.setItem('userTimezone', data.timezone);
          }
        }
      } catch (error) {
        console.error('Error fetching timezone:', error);
      }
    };

    fetchUserTimezone();
  }, [email]);

  const handleTimezoneChange = async (event) => {
    const newTimezone = event.target.value;
    setTimezone(newTimezone);
    localStorage.setItem('userTimezone', newTimezone);

    try {
      await fetch(`${API_BASE_URL}/api/set_timezone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, timezone: newTimezone }),
      });
      
      // Trigger a page reload to refresh all statistics with new timezone
      window.location.reload();
    } catch (error) {
      console.error('Error saving timezone:', error);
    }
  };

  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl fullWidth>
        <InputLabel id="timezone-select-label">Timezone</InputLabel>
        <Select
          labelId="timezone-select-label"
          id="timezone-select"
          value={timezone}
          label="Timezone"
          onChange={handleTimezoneChange}
          sx={{ backgroundColor: 'background.paper' }}
        >
          {timezones.map((tz) => (
            <MenuItem key={tz} value={tz}>
              {tz.replace(/_/g, ' ')}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default TimezoneSelector;