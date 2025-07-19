import { Metadata } from 'next';
import LiffDebug from '@/components/LiffDebug';
import LiffStatus from '@/components/LiffStatus';
import { Container, Typography, Box } from '@mui/material';

export const metadata: Metadata = {
  title: 'LIFF Test - TreeTelu',
  description: 'LINE LIFF Testing Page',
};

export default function LiffTestPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        LINE LIFF Testing
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <LiffDebug />
      </Box>
      
      <Box>
        <LiffStatus />
      </Box>
    </Container>
  );
}