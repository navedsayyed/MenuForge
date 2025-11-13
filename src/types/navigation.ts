// src/types/navigation.ts
import { Dish } from './index';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  AddDish: undefined;
  EditDish: { dish: Dish };
  QR: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
