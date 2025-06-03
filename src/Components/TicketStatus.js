// TicketStatus.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Divider,
  Chip, Paper, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import OrderStatusTimeline from './OrderTimeline';
import Logo from './logo.png';
import Beep from './ORT.mp3';
const API_URL = 'https://caferiadbnode.glitch.me';
const COMPANY_NAME = 'Cafe`ria';
const CONTACT_NUMBER = '+91-9876543210';

const formatDuration = (start, end) => {
  if (!start || !end) return '-';
  const duration = Math.floor((new Date(end) - new Date(start)) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
};

const getCurrentStatus = (ts) => {
  if (ts.served) return 'Served';
  if (ts.ready) return 'Ready';
  if (ts.preparing) return 'Preparing';
  if (ts.onBoard) return 'OnBoard';
  return '🕑 Waiting';
};

const filterOrders = (allOrders, suffix, mob, ticketDate) => {
  const fullTicketId = suffix ? `${ticketDate}-${suffix}`.toLowerCase() : '';
  const qMobile = mob.trim().toLowerCase();
  return allOrders.filter(
    (order) =>
      order.ticketId.toLowerCase() === fullTicketId &&
      order.customer.mobile.toLowerCase() === qMobile
  );
};

const TicketStatus = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ticketSuffix, setTicketSuffix] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [newStatusAvailable, setNewStatusAvailable] = useState(false);
  const audioRef = useRef(null);
  const { ticketId } = useParams();
  const lastStatusesRef = useRef({});

  const ticketDate = (() => {
    const today = new Date();
    return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  })();

  useEffect(() => {
    if (ticketId) setTicketSuffix(ticketId);
  }, [ticketId]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/orders`);
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);
 useEffect(() => {
    if (newStatusAvailable) {
      // Vibrate for 200ms if supported
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch((e) => {
          // handle play error silently (e.g., user hasn't interacted yet)
          console.warn('Sound play prevented:', e);
        });
      }
    }
  }, [newStatusAvailable]);
  const handleSearch = () => {
    setError('');
    if (!/^\d{10}$/.test(mobile.trim())) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    const matched = filterOrders(orders, ticketSuffix, mobile, ticketDate);
    if (matched.length > 0) {
      setFiltered(matched);
      setSubmitted(true);
      const statuses = {};
      matched.forEach(order => {
        statuses[order._id] = order.statusTimestamps || {};
      });
      lastStatusesRef.current = statuses;
      setNewStatusAvailable(false);
    } else {
      setFiltered([]);
      setError('No matching records found. Please check your Ticket ID and Mobile Number.');
    }
  };

  const handleClear = () => {
    setTicketSuffix('');
    setMobile('');
    setFiltered([]);
    setSubmitted(false);
    setError('');
    setNewStatusAvailable(false);
    lastStatusesRef.current = {};
  };

  useEffect(() => {
    if (!submitted) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/orders`);
        setOrders(data);

        const matched = filterOrders(data, ticketSuffix, mobile, ticketDate);
        if (matched.length === 0) {
          setFiltered([]);
          setError('No matching records found on update.');
          setNewStatusAvailable(false);
          lastStatusesRef.current = {};
          return;
        }

        let statusChanged = false;
        matched.forEach(order => {
          const prev = lastStatusesRef.current[order._id] || {};
          const curr = order.statusTimestamps || {};
          const keys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
          for (let key of keys) {
            if ((prev[key] || '') !== (curr[key] || '')) {
              statusChanged = true;
              break;
            }
          }
        });

        if (statusChanged) {
          setNewStatusAvailable(true);
          setFiltered(matched);
          const statuses = {};
          matched.forEach(order => {
            statuses[order._id] = order.statusTimestamps || {};
          });
          lastStatusesRef.current = statuses;
        }
      } catch (error) {
        console.error('Error polling orders:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [submitted, ticketSuffix, mobile, ticketDate]);

  return (
    <Box
      p={{ xs: 2, sm: 4 }}
      bgcolor="#fff"
      color="#000"
      minHeight="100vh"
      sx={{ fontFamily: 'Roboto, sans-serif', position: 'relative' }}
    >
    {/* Logo centered */}
<Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5, mt: 2 }}>
  <img
    src={Logo} 
    alt={`${COMPANY_NAME} Logo`}
    style={{ height: 40, width: 'auto' }}
  />
</Box>

{/* Content container without extra padding on top */}
<Box sx={{ pt: 0 }}>
  <Typography variant="h4" textAlign="center" fontWeight="bold" mb={0.5} color="#000">
    {COMPANY_NAME}
  </Typography>
  <Typography variant="subtitle1" textAlign="center" mb={1} color="#000">
    Date: {new Date().toLocaleDateString()}
  </Typography>

  <Typography variant="h5" textAlign="center" fontWeight="bold" mb={1} color="#000">
    Track Your Order
  </Typography>

        <Dialog
          open={!submitted}
          disableEscapeKeyDown
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              borderRadius: 3,
              px: 2,
              py: 1,
            },
          }}
        >
          <DialogTitle sx={{ color: '#000' }}>Confirm Your Details</DialogTitle>
          <DialogContent
            dividers
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              color: '#000',
            }}
          >
            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ticket ID (Last 4 digits)"
                  value={ticketSuffix}
                  onChange={(e) => setTicketSuffix(e.target.value)}
                  size="small"
                  sx={{ input: { color: '#000' }, label: { color: '#000' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  size="small"
                  sx={{ input: { color: '#000' }, label: { color: '#000' } }}
                />
              </Grid>
              {error && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="error" align="center">
                    {error}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleClear}
              color="secondary"
              startIcon={<ClearIcon />}
              sx={{ color: '#000' }}
            >
              Clear
            </Button>
            <Button
              onClick={handleSearch}
              variant="contained"
              startIcon={<SearchIcon />}
              disabled={loading}
              sx={{
                bgcolor: '#FFEB3B', // bright yellow
                color: '#000',
                '&:hover': {
                  bgcolor: '#FDD835',
                },
              }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        {loading && (
          <Box textAlign="center" mt={4}>
            <CircularProgress />
          </Box>
        )}

        <audio ref={audioRef} src={Beep} preload="auto" />
      {newStatusAvailable && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            bgcolor: '#FFEB3B',
            color: '#000',
            px: 2,
            py: 1,
            borderRadius: 2,
            cursor: 'pointer',
            boxShadow: 3,
            zIndex: 1300,
            userSelect: 'none',
          }}
          onClick={() => setNewStatusAvailable(false)}
          title="Click to dismiss notification"
        >
          🔔 New status update available! .
        </Box>
      )}

        {!loading && submitted && filtered.length > 0 && filtered.map(order => {
          const ts = order.statusTimestamps || {};
          const status = getCurrentStatus(ts);
          const totalTime = formatDuration(ts.onBoard, ts.served);

          return (
            <Paper
              key={order._id}
              elevation={3}
              sx={{ p: 3, mb: 4, maxWidth: 720, mx: 'auto', borderRadius: 3, color: '#000' }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="#000">
                {order.ticketId} - {order.customer.name}
              </Typography>
              <Chip label={status} color="primary" size="small" sx={{ my: 1 }} />
              <Typography variant="body2" color="#000"><strong>Mobile:</strong> {order.customer.mobile}</Typography>
              <Typography variant="body2" mb={2} color="#000"><strong>Total Time:</strong> {totalTime}</Typography>
              <Divider sx={{ mb: 2 }} />
              <OrderStatusTimeline order={order} />
              <Divider sx={{ my: 2 }} />

              {status === 'Served' && (
                <Typography variant="body2" color="success.main" textAlign="center" fontWeight="medium" mb={1}>
                  Thank you for your purchase!
                </Typography>
              )}

              <Typography variant="caption" display="block" textAlign="center" color="#000">
                Please wait patiently while your food is being prepared.
              </Typography>
              <Typography variant="caption" display="block" textAlign="center" color="#000" mb={1}>
                Estimated wait time: 15 to 30 minutes.
              </Typography>
              <Typography variant="caption" display="block" textAlign="center" color="#000" fontWeight="bold">
                Contact: {CONTACT_NUMBER}
              </Typography>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default TicketStatus;
