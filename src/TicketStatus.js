import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Divider,
  Chip, Paper, Grid, useTheme
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const API_URL = 'https://caferiadbnode.glitch.me' || 'http://localhost:5000';
const COMPANY_NAME = 'Caferia';
const CONTACT_NUMBER = '+91-9876543210';

const formatTime = (timestamp) =>
  timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

const formatDuration = (start, end) => {
  if (!start || !end) return '-';
  const duration = Math.floor((new Date(end) - new Date(start)) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
};

const getCurrentStatus = (ts) => {
  if (ts.served) return '🍽️ Served';
  if (ts.ready) return '✅ Ready';
  if (ts.preparing) return '🛠️ Preparing';
  if (ts.onBoard) return '🟢 OnBoard';
  return '🕑 Waiting';
};

const TicketStatus = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ticketSuffix, setTicketSuffix] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const theme = useTheme();
  const { ticketId } = useParams();

  const today = new Date();
  const ticketDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const todayFormatted = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const today = new Date(); // ✅ moved here
      const { data } = await axios.get(`${API_URL}/api/orders`);
      const todayOrders = data.filter(order => {
        const createdAt = new Date(order.createdAt);
        return (
          createdAt.getFullYear() === today.getFullYear() &&
          createdAt.getMonth() === today.getMonth() &&
          createdAt.getDate() === today.getDate()
        );
      });
      setOrders(todayOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchOrders();
}, []);


  useEffect(() => {
    if (ticketId && orders.length > 0 && mobile.trim()) {
      setTicketSuffix(ticketId);
      const fullTicketId = `${ticketDate}-${ticketId}`.toLowerCase();
      const matched = orders.filter(order =>
        order.ticketId.toLowerCase() === fullTicketId &&
        order.customer.mobile.toLowerCase() === mobile.trim().toLowerCase()
      );
      setFiltered(matched);
      setSubmitted(true);
    }
  }, [ticketId, orders, ticketDate, mobile]);

  const handleSearch = () => {
    setSubmitted(true);
    const fullTicketId = ticketSuffix ? `${ticketDate}-${ticketSuffix}` : '';
    const qTicket = fullTicketId.trim().toLowerCase();
    const qMobile = mobile.trim().toLowerCase();

    const matched = orders.filter(order =>
      qTicket && qMobile &&
      order.ticketId.toLowerCase() === qTicket &&
      order.customer.mobile.toLowerCase() === qMobile
    );

    setFiltered(matched);
  };

  const handleClear = () => {
    setTicketSuffix('');
    setMobile('');
    setFiltered([]);
    setSubmitted(false);
  };

  return (
    <Box p={{ xs: 2, sm: 3 }} bgcolor={theme.palette.grey[50]} minHeight="100vh">
      {/* Company Header */}
      <Typography variant="h4" textAlign="center" fontWeight="bold" mb={1} color="primary">
        {COMPANY_NAME}
      </Typography>

      <Typography variant="h5" textAlign="center" fontWeight="bold" mb={1} color="primary.dark">
        Track Your Order
      </Typography>

      <Typography variant="subtitle2" textAlign="center" color="text.secondary" mb={3}>
        Today's Date: <strong>{todayFormatted}</strong>
      </Typography>

      {/* Search Form */}
      <Paper elevation={2} sx={{ p: 3, maxWidth: 700, mx: 'auto', mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ticket ID (Last 4 digits)"
              value={ticketSuffix}
              onChange={(e) => setTicketSuffix(e.target.value)}
              size="small"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              size="small"
              variant="outlined"
              required
            />
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading || !ticketSuffix || !mobile}
            >
              Submit
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<ClearIcon />}
              onClick={handleClear}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : (
        submitted && (
          filtered.length === 0 ? (
            <Typography textAlign="center" color="error" fontWeight="medium" mt={2}>
              No records found.
            </Typography>
          ) : (
            filtered.map(order => {
              const ts = order.statusTimestamps || {};
              const status = getCurrentStatus(ts);
              const totalTime = formatDuration(ts.onBoard, ts.served);

              const timelineSteps = [
                { label: '🟢 OnBoard', time: ts.onBoard },
                { label: '🛠️ Preparing', time: ts.preparing },
                { label: '✅ Ready', time: ts.ready },
                { label: '🍽️ Served', time: ts.served },
              ].filter(step => step.time);

              return (
                <Paper key={order._id} elevation={3} sx={{ p: 3, mb: 4, maxWidth: 720, mx: 'auto', borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    🎟️ {order.ticketId} - {order.customer.name}
                  </Typography>
                  <Chip label={status} color="primary" size="small" sx={{ my: 1 }} />
                  <Typography variant="body2"><strong>Mobile:</strong> {order.customer.mobile}</Typography>
                  <Typography variant="body2" mb={2}><strong>Total Time:</strong> {totalTime}</Typography>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ borderLeft: '3px solid #1976d2', pl: 2 }}>
                    {timelineSteps.map((step, index) => (
                      <Box key={index} mb={index < timelineSteps.length - 1 ? 2 : 0}>
                        <Typography variant="body2" fontWeight="medium">
                          {step.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle' }} /> {formatTime(step.time)}
                        </Typography>
                        {index < timelineSteps.length - 1 && <Divider sx={{ mt: 1 }} />}
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {status === '🍽️ Served' && (
                    <Typography variant="body2" color="success.main" textAlign="center" fontWeight="medium" mb={1}>
                      🎉 Thank you for your purchase!
                    </Typography>
                  )}

                  <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
                    Please wait patiently while your food is being prepared.
                  </Typography>
                  <Typography variant="caption" display="block" textAlign="center" color="text.secondary" mb={1}>
                    Estimated wait time: 15 to 30 minutes.
                  </Typography>
                  <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
                    📞 Contact us: {CONTACT_NUMBER}
                  </Typography>
                </Paper>
              );
            })
          )
        )
      )}
    </Box>
  );
};

export default TicketStatus;
