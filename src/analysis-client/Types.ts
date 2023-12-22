export interface CheckingResponse {
  property_results: PropertyResult[];
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
}

export interface Snapshot {
  id: string;
  tokens: Tokens;
}

export interface Tokens {
  [key: string]: number;
}

export interface Transition {
  label: string;
  next_state: State;
}