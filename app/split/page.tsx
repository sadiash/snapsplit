"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroStrip } from '@/components/hero-strip';
import { Navigation } from '@/components/navigation';
import { Mic, Users, Equal, Play, Pause, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ReceiptItem, Participant } from '@/lib/supabase';

export default function SplitPage() {
  const [receiptData, setReceiptData] = useState<any>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isApplyingRule, setIsApplyingRule] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load receipt data from session storage
    const storedData = sessionStorage.getItem('receiptData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setReceiptData(data);
      setItems(data.items || []);
    } else {
      // No receipt data, redirect to snap
      router.push('/snap');
    }
  }, [router]);

  const handleVoiceRecording = async () => {
    if (!navigator.mediaDevices) {
      toast.error('Voice recording not supported on this device');
      return;
    }

    try {
      setIsRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await processVoiceRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      // Stop recording after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 5000);

    } catch (error) {
      toast.error('Failed to access microphone');
      setIsRecording(false);
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process voice');
      }

      // Parse names from transcription
      const names = result.text.split(/[,\s]+/).filter((name: string) => name.length > 1);
      
      // Add participants
      const newParticipants = names.map((name: string) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
        total_amount: 0,
      }));

      setParticipants(prev => [...prev, ...newParticipants]);
      toast.success(`Added ${names.length} participant(s)`);

    } catch (error) {
      toast.error("Didn't catch that — try again");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleEqualSplit = () => {
    if (participants.length === 0) {
      toast.error('Add participants first');
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    const amountPerPerson = totalAmount / participants.length;

    const updatedItems = items.map(item => ({
      ...item,
      is_shared: true,
      assigned_to: participants.map(p => p.id),
    }));

    const updatedParticipants = participants.map(p => ({
      ...p,
      total_amount: amountPerPerson,
    }));

    setItems(updatedItems);
    setParticipants(updatedParticipants);
    toast.success('Split equally applied!');
  };

  const handleItemToggle = (itemIndex: number) => {
    const updatedItems = [...items];
    updatedItems[itemIndex].is_shared = !updatedItems[itemIndex].is_shared;
    
    // Recalculate totals
    calculateTotals(updatedItems);
    setItems(updatedItems);
  };

  const calculateTotals = (currentItems: ReceiptItem[]) => {
    const sharedTotal = currentItems
      .filter(item => item.is_shared)
      .reduce((sum, item) => sum + item.price, 0);
    
    const sharedPerPerson = participants.length > 0 ? sharedTotal / participants.length : 0;
    
    const updatedParticipants = participants.map(p => ({
      ...p,
      total_amount: sharedPerPerson,
    }));
    
    setParticipants(updatedParticipants);
  };

  const handleContinueToShare = () => {
    if (participants.length === 0) {
      toast.error('Add at least one participant');
      return;
    }

    // Store split data for sharing
    const splitData = {
      receipt: receiptData,
      items,
      participants,
    };
    
    sessionStorage.setItem('splitData', JSON.stringify(splitData));
    router.push('/share');
  };

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <HeroStrip 
        title={receiptData.vendor || 'Unknown Vendor'} 
        subtitle={`Total: PKR ${receiptData.total?.toFixed(2) || '0.00'}`}
      />
      
      <div className="px-4 py-6 space-y-6">
        {/* Participants Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-semibold tracking-tight flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Participants ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {participants.map((participant) => (
                <Badge 
                  key={participant.id}
                  variant="secondary"
                  className="px-3 py-1 bg-accent-teal-100 dark:bg-accent-teal-900 text-accent-teal-700 dark:text-accent-teal-300"
                >
                  {participant.name}
                  {(participant.total_amount || 0) > 0 && (
                    <span className="ml-1 text-xs">
                      PKR {(participant.total_amount || 0).toFixed(2)}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleVoiceRecording}
                disabled={isRecording || isProcessingVoice}
                className="flex-1 bg-accent-mustard-500 hover:bg-accent-mustard-600 text-white transition-all duration-200 ease-out active:scale-95"
              >
                {isRecording ? (
                  <>
                    <div className="mr-2 w-2 h-2 bg-red-500 rounded-full animate-pulse-wave"></div>
                    Recording...
                  </>
                ) : isProcessingVoice ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Add by Voice
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  const name = prompt('Enter participant name:');
                  if (name?.trim()) {
                    const newParticipant = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: name.trim(),
                      total_amount: 0,
                    };
                    setParticipants(prev => [...prev, newParticipant]);
                  }
                }}
                className="border-accent-teal-500 text-accent-teal-500 hover:bg-accent-teal-50 dark:hover:bg-accent-teal-950 transition-all duration-200 ease-out active:scale-95"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-semibold tracking-tight">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleItemToggle(index)}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.text}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      PKR {item.price.toFixed(2)}
                    </p>
                  </div>
                  <Badge 
                    variant={item.is_shared ? "default" : "secondary"}
                    className={item.is_shared 
                      ? "bg-accent-mustard-500 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }
                  >
                    {item.is_shared ? 'Shared' : 'Individual'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rules Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-semibold tracking-tight">Split Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleEqualSplit}
              className="w-full bg-accent-teal-500 hover:bg-accent-teal-600 text-white transition-all duration-200 ease-out active:scale-95"
            >
              <Equal className="mr-2 h-4 w-4" />
              Equal Split
            </Button>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <Button
          onClick={handleContinueToShare}
          disabled={participants.length === 0}
          className="w-full h-12 bg-accent-mustard-500 hover:bg-accent-mustard-600 text-white font-medium transition-all duration-200 ease-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Share
        </Button>
      </div>
      
      <Navigation />
    </div>
  );
}