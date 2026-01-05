import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneIncoming, PhoneOff, Monitor, Activity, Trash2, Info } from 'lucide-react';

export default function App() {
  // State to store the logs of events received from Zoom
  const [eventLogs, setEventLogs] = useState([]);
  // State to track current call status based on events
  const [callStatus, setCallStatus] = useState('Idle');
  
  // Ref to the iframe to post messages back if needed (for v3 init)
  const iframeRef = useRef(null);

  // The origin URL. In a real app, this should match window.location.origin
  // We use the one you provided, but you can switch to dynamic origin for local testing
  const zoomSrc = "https://zoom.us/cci/callbar/crm/?origin=https://app.konnectinsights.com";

  useEffect(() => {
    // Handler for receiving messages from the iframe
    const handleMessage = (e) => {
      // Basic security check: In production, verify e.origin matches "https://zoom.us"
      const data = e.data;

      // Filter only for relevant Zoom Contact Center events
      if (data && typeof data.type === 'string' && data.type.startsWith('zcc-')) {
        
        const timestamp = new Date().toLocaleTimeString();
        const newLog = {
          id: Date.now(),
          type: data.type,
          payload: data.data,
          time: timestamp
        };

        // Update logs
        setEventLogs((prev) => [newLog, ...prev]);

        // Handle specific business logic for the requested events
        switch (data.type) {
          case 'zcc-call-ringing':
          case 'zcc-incomingPhone-request':
            setCallStatus('Ringing');
            break;
          
          case 'zcc-call-connected':
            setCallStatus('Connected');
            break;
          
          case 'zcc-call-ended':
            setCallStatus('Ended');
            // Reset to idle after a few seconds if desired
            setTimeout(() => setCallStatus('Idle'), 3000);
            break;
            
          case 'zcc-screen-pop':
            // Logic for screen pop (e.g., opening a CRM record) would go here
            console.log("Screen Pop Triggered", data.data);
            break;

          default:
            break;
        }
      }
    };

    // Add event listener
    window.addEventListener('message', handleMessage);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Function to clear logs
  const clearLogs = () => setEventLogs([]);

  // Helper to determine status color
  const getStatusColor = () => {
    switch (callStatus) {
      case 'Ringing': return 'bg-yellow-500';
      case 'Connected': return 'bg-green-500';
      case 'Ended': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Phone size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">CRM Integration <span className="text-gray-400 font-normal">| Zoom Smart Embed</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white border rounded-full shadow-sm">
            <span className={`w-3 h-3 rounded-full animate-pulse ${getStatusColor()}`}></span>
            <span className="text-sm font-medium text-gray-600">Status: {callStatus}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: The Embedded Softphone */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-700">Softphone Embed</h2>
              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-200 rounded">v3</span>
            </div>
            
            <div className="flex-1 bg-gray-100 relative">
               {/* NOTE: The src uses the origin provided in the prompt. 
                  In a real deployment, if the origin parameter doesn't match the hosting domain, 
                  Zoom might block the connection due to security policies.
               */}
              <iframe
                ref={iframeRef}
                src={zoomSrc}
                title="Zoom Contact Center"
                id="zoom-embeddable-phone-iframe"
                sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin allow-downloads"
                allow="autoplay;microphone;camera;display-capture;midi;encrypted-media;clipboard-write;"
                className="w-full h-full border-none"
              />
              
              {/* Overlay for demo purposes if iframe refuses to load in this specific preview environment due to CORS/Origin */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/5">
                <p className="text-xs text-gray-500 bg-white p-1 rounded">Iframe Container</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Event Logger */}
        <div className="w-1/3 min-w-[350px] bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2 text-gray-700">
              <Activity size={18} />
              <h2 className="font-semibold">Event Console</h2>
            </div>
            <button 
              onClick={clearLogs}
              className="p-1.5 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-md transition-colors"
              title="Clear Logs"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="p-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-800 flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>Listening for: zcc-call-ringing, zcc-connected, zcc-screen-pop, and others.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {eventLogs.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                <Monitor size={40} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Waiting for events...</p>
                <p className="text-xs mt-2 opacity-60">Interact with the softphone to see logs here.</p>
              </div>
            ) : (
              eventLogs.map((log) => (
                <div key={log.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-in slide-in-from-right-2 duration-300">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      log.type.includes('ringing') ? 'bg-yellow-100 text-yellow-800' :
                      log.type.includes('connected') ? 'bg-green-100 text-green-800' :
                      log.type.includes('ended') ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{log.time}</span>
                  </div>
                  
                  {log.payload && (
                    <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                      <pre className="text-[10px] text-gray-600 overflow-x-auto font-mono">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Icon helpers based on type */}
                  <div className="mt-1 flex justify-end">
                    {log.type.includes('ringing') && <PhoneIncoming size={14} className="text-yellow-500" />}
                    {log.type.includes('connected') && <Phone size={14} className="text-green-500" />}
                    {log.type.includes('ended') && <PhoneOff size={14} className="text-red-500" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}