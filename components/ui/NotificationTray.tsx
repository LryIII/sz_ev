import React from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Alert } from '../../types';
import { COLORS } from '../../constants';

interface NotificationTrayProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

export const NotificationTray: React.FC<NotificationTrayProps> = ({ alerts, onDismiss }) => {
  return (
    <div className="absolute top-20 right-6 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      {alerts.slice(-5).reverse().map((alert) => (
        <div 
          key={alert.id}
          className={`
            pointer-events-auto flex items-start gap-3 p-3 rounded shadow-lg backdrop-blur-md border animate-slideIn
            ${alert.type === 'critical' ? 'bg-red-950/80 border-red-500 text-red-100' : 
              alert.type === 'warning' ? 'bg-orange-950/80 border-orange-500 text-orange-100' : 
              'bg-blue-950/80 border-blue-500 text-blue-100'}
          `}
        >
          <div className="mt-0.5 shrink-0">
            {alert.type === 'critical' && <AlertCircle size={18} className="text-red-500" />}
            {alert.type === 'warning' && <AlertTriangle size={18} className="text-orange-500" />}
            {alert.type === 'info' && <Info size={18} className="text-blue-500" />}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wide mb-0.5">
              {alert.type === 'critical' ? '紧急警报' : alert.type === 'warning' ? '警告' : '通知'}
            </p>
            <p className="text-xs leading-relaxed opacity-90">{alert.message}</p>
            <span className="text-[9px] opacity-60 mt-1 block font-mono">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <button 
            onClick={() => onDismiss(alert.id)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};