import React from 'react';
import { useNotification, type Notification, type NotificationType } from '../../contexts/NotificationContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { removeNotification } = useNotification();

  const getIconAndColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          textColor: 'text-green-800',
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50 border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800',
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800',
        };
    }
  };

  const { icon: Icon, bgColor, iconColor, textColor } = getIconAndColor(notification.type);

  return (
    <div
      className={`${bgColor} border rounded-lg shadow-lg p-4 mb-3 transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-5`}
    >
      <div className="flex items-start">
        <Icon className={`${iconColor} w-5 h-5 mt-0.5 mr-3 flex-shrink-0`} />
        
        <div className="flex-1 min-w-0">
          <h4 className={`${textColor} text-sm font-medium`}>
            {notification.title}
          </h4>
          {notification.message && (
            <p className={`${textColor} text-sm mt-1 opacity-90`}>
              {notification.message}
            </p>
          )}
          
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className={`${textColor} text-sm font-medium underline mt-2 hover:no-underline focus:outline-none`}
            >
              {notification.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => removeNotification(notification.id)}
          className={`${iconColor} hover:opacity-70 focus:outline-none ml-2 flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default NotificationContainer;
