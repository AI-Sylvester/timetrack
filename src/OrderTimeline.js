import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import {
  AccessTime,
  Restaurant,
  CheckCircle,
  DoneAll,
  CancelPresentation,
} from '@mui/icons-material';

const STATUS_FLOW = ['onBoard', 'preparing', 'ready', 'served'];
const STATUS_COLORS = {
  onBoard: '#1976d2',
  preparing: '#212121',
  ready: '#006994',
  served: '#2e7d32',
  canceled: '#d32f2f',
};

const STATUS_ICONS = {
  onBoard: <AccessTime fontSize="small" />,
  preparing: <Restaurant fontSize="small" />,
  ready: <CheckCircle fontSize="small" />,
  served: <DoneAll fontSize="small" />,
  canceled: <CancelPresentation fontSize="small" />,
};

const OrderStatusTimeline = ({ order }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getStatusTimestamp = (status) => {
    if (order.statusTimestamps && order.statusTimestamps[status]) {
      return new Date(order.statusTimestamps[status]);
    }
    if (status === 'onBoard') return new Date(order.createdAt);
    return null;
  };

  const steps = order.status === 'canceled' ? ['onBoard', 'canceled'] : STATUS_FLOW;
  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: isMobile ? 'center' : 'flex-start',
        alignItems: 'center',
        mt: 2,
        rowGap: isMobile ? 2 : 0,
      }}
    >
      {steps.map((step, idx) => {
        const isActive = step === order.status;
        const isCompleted = STATUS_FLOW.indexOf(step) < currentIndex;
        const isCanceled = step === 'canceled';
        const iconColor = isActive || isCompleted || isCanceled ? STATUS_COLORS[step] : '#ccc';

        return (
          <React.Fragment key={step}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: isMobile ? 60 : 70,
                minWidth: 45,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  backgroundColor: iconColor,
                  borderRadius: '50%',
                  width: isMobile ? 24 : 26,
                  height: isMobile ? 24 : 26,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#fff',
                  border: isActive ? `2px solid ${STATUS_COLORS[order.status]}` : 'none',
                  boxShadow: isActive
                    ? `0 0 8px 2px ${STATUS_COLORS[step]}`
                    : isCompleted
                    ? `0 0 4px ${STATUS_COLORS[step]}`
                    : 'none',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {React.cloneElement(STATUS_ICONS[step], {
                  fontSize: isMobile ? 'inherit' : 'small',
                })}
              </Box>

              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: isActive
                    ? STATUS_COLORS[step]
                    : isCompleted || isCanceled
                    ? '#666'
                    : '#aaa',
                  fontWeight: isActive ? 600 : 400,
                  textTransform: 'capitalize',
                }}
              >
                {step}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.6rem',
                  color: '#777',
                }}
              >
                {(() => {
                  const ts = getStatusTimestamp(step);
                  return ts
                    ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '-';
                })()}
              </Typography>
            </Box>

            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <Box
                sx={{
                  height: 2,
                  width: isMobile ? 20 : 40,
                  backgroundColor:
                    STATUS_FLOW.indexOf(steps[idx + 1]) <= currentIndex
                      ? STATUS_COLORS[order.status]
                      : '#ccc',
                  mx: 0.7,
                  mt: isMobile ? 1.2 : 0.9,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default OrderStatusTimeline;
