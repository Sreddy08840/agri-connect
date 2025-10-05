import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Customer: NavigatorScreenParams<CustomerTabParamList>;
  Farmer: NavigatorScreenParams<FarmerTabParamList>;
};

export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  FarmerLogin: undefined;
  FarmerRegister: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  OTPVerification: { pendingSessionId: string; phone: string; isLogin: boolean };
};

export type CustomerTabParamList = {
  Home: undefined;
  Products: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  CustomerTabs: NavigatorScreenParams<CustomerTabParamList>;
  ProductDetail: { productId: string };
  Checkout: undefined;
  OrderDetail: { orderId: string };
  OrderConfirmation: { orderId: string };
  EditProfile: undefined;
  HelpCenter: undefined;
  FAQ: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  ContactSupport: undefined;
};

export type FarmerTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type FarmerStackParamList = {
  FarmerTabs: NavigatorScreenParams<FarmerTabParamList>;
  AddProduct: undefined;
  EditProduct: { productId: string };
  OrderDetail: { orderId: string };
  EditProfile: undefined;
};
