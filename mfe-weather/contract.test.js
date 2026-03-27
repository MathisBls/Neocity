class EventBus {
  constructor() { this.listeners = {}; }
  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
    return () => this.off(event, cb);
  }
  off(event, cb) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(c => c !== cb);
  }
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  }
}

let eventBus;

beforeEach(() => {
  eventBus = new EventBus();
});

test('weather:change émet le bon format de payload', (done) => {
  eventBus.on('weather:change', (data) => {
    expect(data).toHaveProperty('condition');
    expect(data).toHaveProperty('intensity');
    expect(data).toHaveProperty('temperature');
    expect(data).toHaveProperty('toxicity');
    expect(typeof data.condition).toBe('string');
    expect(typeof data.intensity).toBe('number');
    expect(typeof data.temperature).toBe('number');
    expect(typeof data.toxicity).toBe('number');
    done();
  });

  eventBus.emit('weather:change', {
    condition: 'storm',
    intensity: 72,
    temperature: -3,
    toxicity: 42,
  });
});

test('weather:change — état normal a des valeurs cohérentes', (done) => {
  eventBus.on('weather:change', (data) => {
    expect(data.condition).toBe('clear');
    expect(data.intensity).toBe(0);
    expect(data.toxicity).toBe(0);
    done();
  });

  eventBus.emit('weather:change', {
    condition: 'clear',
    intensity: 0,
    temperature: 18,
    toxicity: 0,
  });
});

test('weather:change — état smog (riot) a de la toxicité', (done) => {
  eventBus.on('weather:change', (data) => {
    expect(data.condition).toBe('smog');
    expect(data.toxicity).toBeGreaterThan(0);
    expect(data.temperature).toBeGreaterThan(20);
    done();
  });

  eventBus.emit('weather:change', {
    condition: 'smog',
    intensity: 50,
    temperature: 34,
    toxicity: 65,
  });
});

test('weather:change — état electromagnetic (drones)', (done) => {
  eventBus.on('weather:change', (data) => {
    expect(data.condition).toBe('electromagnetic');
    expect(data.intensity).toBeGreaterThan(50);
    done();
  });

  eventBus.emit('weather:change', {
    condition: 'electromagnetic',
    intensity: 80,
    temperature: 12,
    toxicity: 15,
  });
});

test('hacker:command contient une propriété command de type string', (done) => {
  eventBus.on('hacker:command', (data) => {
    expect(data).toHaveProperty('command');
    expect(typeof data.command).toBe('string');
    done();
  });

  eventBus.emit('hacker:command', { command: 'storm' });
});
