
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, RefreshCcw } from 'lucide-react';

const NotFoundState: React.FC = () => {
  const navigate = useNavigate();
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center animate-fade-in max-w-lg mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Agreement Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The agreement you're looking for doesn't exist or has been deleted.
        </p>
        
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Possible reasons:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc text-left pl-5 mt-2">
              <li>The link might be incorrect or expired</li>
              <li>The agreement has been deleted by the creator or recipient</li>
              <li>The agreement may not have been saved properly</li>
              <li>You might need to log in to view this agreement</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/my-agreements')}>
            My Agreements
          </Button>
          <Button variant="ghost" onClick={handleRefresh} className="flex items-center gap-1">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundState;
