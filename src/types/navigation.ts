// src/types/navigation.ts
import { NavigatorScreenParams } from '@react-navigation/native';
import { Dish } from './index';

export type MainTabParamList = {
  DashboardTab: undefined;
  QRTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  AddDish: undefined;
  EditDish: { dish: Dish };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
