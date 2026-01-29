import React from 'react';
import { AlertCircle, AlertTriangle, Info, X, MapPin } from 'lucide-react';
import { Alert } from '../../types';
import { COLORS } from '../../constants';

interface NotificationTrayProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onAlertClick: (alert: Alert) => void;
}

export const NotificationTray: React.FC<NotificationTrayProps> = ({ alerts, onDismiss, onAlertClick }) => {
  return (
    <div className="absolute top-20 right-6 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      {alerts.slice(-5).reverse().map((alert) => (
        <div 
          key={alert.id}
          onClick={() => onAlertClick(alert)}
          className={`
            pointer-events-auto flex items-start gap-3 p-3 rounded shadow-lg backdrop-blur-md border animate-slideIn cursor-pointer transition-all hover:brightness-110 hover:scale-[1.02] group
            ${alert.type === 'critical' ? 'bg-red-950/90 border-red-500 text-red-100 shadow-red-900/20' : 
              alert.type === 'warning' ? 'bg-orange-950/90 border-orange-500 text-orange-100 shadow-orange-900/20' : 
              'bg-blue-950/90 border-blue-500 text-blue-100 shadow-blue-900/20'}
          `}
        >
          <div className="mt-0.5 shrink-0">
            {alert.type === 'critical' && <AlertCircle size={18} className="text-red-500 animate-pulse" />}
            {alert.type === 'warning' && <AlertTriangle size={18} className="text-orange-500" />}
            {alert.type === 'info' && <Info size={18} className="text-blue-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide mb-0.5">
                {alert.type === 'critical' ? '紧急警报' : alert.type === 'warning' ? '警告' : '通知'}
                </p>
                {alert.targetId && (
                    <span className="flex items-center text-[9px] bg-black/20 px-1.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        <MapPin size={8} className="mr-1" />
                        定位区域
                    </span>
                )}
            </div>
            <p className="text-xs leading-relaxed opacity-90 break-words">{alert.message}</p>
            <span className="text-[9px] opacity-60 mt-1 block font-mono">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onDismiss(alert.id);
            }}
            className="text-white/40 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
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