export interface CheckingResponse {
  property_results: PropertyResult[];
  unsupported_elements: string[];
}

export interface PropertyResult {
  property: string;
  fulfilled: boolean;
  problematic_elements: string[];
  counter_example?: CounterExample;
}

export interface CounterExample {
  start_state: State;
  transitions: Transition[];
}

export interface State {
  snapshots: Snapshot[];
  messages: Map<string, number>;
}

export interface Snapshot {
  id: string;
  tokens: Map<string, number>;
}

export interface Transition {
  label: string;
  next_state: State;
}
