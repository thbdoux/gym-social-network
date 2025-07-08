// api/utils/authEvents.ts
type AuthEventType = 'logout' | 'login' | 'tokenExpired';
type Listener = (eventType: AuthEventType) => void;

class AuthEventEmitter {
  private listeners: Listener[] = [];

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public emit(eventType: AuthEventType): void {
    this.listeners.forEach(listener => listener(eventType));
  }
}

// Create a singleton instance
export const authEvents = new AuthEventEmitter();