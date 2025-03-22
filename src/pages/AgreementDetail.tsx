
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/useAgreementsContext';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import AgreementHeader from '@/components/agreement/AgreementHeader';
import AgreementParties from '@/components/agreement/AgreementParties';
import AgreementMessage from '@/components/agreement/AgreementMessage';
import AgreementActions from '@/components/agreement/AgreementActions';
import LoginPrompt from '@/components/agreement/LoginPrompt';
import LoadingState from '@/components/agreement/LoadingState';
import NotFoundState from '@/components/agreement/NotFoundState';
import { 
  getAgreementById as getAgreementByIdUtil,
  ensureAgreementInStorage,
  getStoredAgreements 
} from '@/utils/agreementUtils';
import { Agreement } from '@/types/agreement';
import { toast } from '@/lib/toast';

const AgreementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreementById, respondToAgreement, requestDeleteAgreement, loading: contextLoading } = useAgreements();
  const { user, isAuthenticated } = useAuth();
  const [isResponding, setIsResponding] = useState(false);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  
  useEffect(() => {
    const loadAgreement = () => {
      if (!id) {
        console.log("No agreement ID provided in URL");
        setNotFound(true);
        setLocalLoading(false);
        return;
      }

      console.log("Loading agreement with ID:", id);

      try {
        // First try from context
        let foundAgreement = getAgreementById(id);
        
        // If not found in context, try directly from localStorage
        if (!foundAgreement) {
          console.log('Agreement not found in context, trying localStorage...');
          foundAgreement = getAgreementByIdUtil(id);
          
          // If found in localStorage but not in context, refresh the context
          if (foundAgreement) {
            console.log('Agreement found in localStorage but not in context, ensuring it is in storage');
            ensureAgreementInStorage(foundAgreement);
            
            // Trigger a storage event to refresh the agreements in other tabs
            const event = new Event('agreementsUpdated');
            document.dispatchEvent(event);
          }
        }
        
        if (foundAgreement) {
          console.log('Agreement found:', foundAgreement);
          setAgreement(foundAgreement);
          document.title = `Agreement | PactPal`;
        } else {
          console.log('Agreement not found with ID:', id);
          setNotFound(true);
          toast.error("Agreement not found. It may have been deleted or doesn't exist.");
        }
      } catch (error) {
        console.error("Error loading agreement:", error);
        setNotFound(true);
        toast.error("Error loading agreement. Please try again.");
      } finally {
        setLocalLoading(false);
      }
    };
    
    loadAgreement();
    
    // Listen for storage events to reload agreement if it changes in another tab
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'pact_pal_agreements') {
        console.log("Storage event detected, reloading agreement");
        loadAgreement();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from the current tab
    const handleCustomEvent = () => {
      console.log("Custom event detected, reloading agreement");
      loadAgreement();
    };
    
    document.addEventListener('agreementsUpdated', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('agreementsUpdated', handleCustomEvent);
    };
  }, [id, getAgreementById]);
  
  if (contextLoading || localLoading) {
    return <LoadingState />;
  }
  
  if (notFound || !agreement) {
    return <NotFoundState />;
  }
  
  const isCreator = user?.id === agreement?.creatorId;
  const isRecipient = user?.id === agreement?.recipientId;
  const canRespond = isAuthenticated && agreement?.status === 'pending' && !isCreator;
  const canDelete = isAuthenticated && 
                    agreement?.status === 'accepted' && 
                    (isCreator || isRecipient) && 
                    !agreement.deleteRequestedBy.includes(user?.id || '');
  const hasRequestedDelete = user?.id ? agreement?.deleteRequestedBy.includes(user.id) : false;
  
  const handleResponse = async (accept: boolean) => {
    if (!id) return;
    
    try {
      setIsResponding(true);
      await respondToAgreement(id, accept);
      // Update the local agreement state after response
      const updatedAgreement = getAgreementById(id);
      if (updatedAgreement) {
        setAgreement(updatedAgreement);
      }
    } catch (error) {
      console.error("Error responding to agreement:", error);
      toast.error("Failed to respond to agreement. Please try again.");
    } finally {
      setIsResponding(false);
    }
  };
  
  const handleRequestDelete = async () => {
    if (!id) return;
    
    try {
      await requestDeleteAgreement(id);
      // Update the local agreement state after delete request
      const updatedAgreement = getAgreementById(id);
      if (updatedAgreement) {
        setAgreement(updatedAgreement);
      } else {
        // Agreement was fully deleted
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error requesting deletion:", error);
      toast.error("Failed to request deletion. Please try again.");
    }
  };
  
  return (
    <Layout>
      <div className="min-h-[80vh] max-w-2xl mx-auto animate-fade-in">
        <Card className="glass-card animate-scale-in overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <AgreementHeader status={agreement.status} />
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="mb-6">
              <AgreementParties 
                creatorName={agreement.creatorName}
                recipientName={agreement.recipientName}
                createdAt={agreement.createdAt}
              />
              
              <AgreementMessage message={agreement.message} />
            </div>
            
            {!isAuthenticated && agreement.status === 'pending' && (
              <LoginPrompt />
            )}
          </CardContent>
          
          <CardFooter className="p-0">
            <AgreementActions
              id={agreement.id}
              status={agreement.status}
              canRespond={canRespond}
              canDelete={canDelete}
              isResponding={isResponding}
              isCreator={isCreator}
              hasRequestedDelete={hasRequestedDelete}
              onResponse={handleResponse}
              onRequestDelete={handleRequestDelete}
            />
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default AgreementDetail;
