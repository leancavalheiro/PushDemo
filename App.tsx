import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Button,
  ActivityIndicator,
  Text,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Config from './src/config/AppConfig'
import DemoNotificationService from './src/services/DemoNotificationService';
import DemoNotificationRegistrationService from './src/services/DemoNotificationRegistrationService';
import AppConfig from './src/config/AppConfig';

declare const global: { HermesInternal: null | {} };

interface IState {
  status: string,
  registeredOS: string,
  registeredToken: string,
  isRegistered: boolean,
  isBusy: boolean,
}

class App extends Component<IState> {
  state: IState;
  notificationService: DemoNotificationService;
  notificationRegistrationService: DemoNotificationRegistrationService;
  deviceId: string;

  constructor(props: any) {
    super(props);
    this.deviceId = DeviceInfo.getUniqueId();
    this.state = {
      status: "Status do Regsitro Desconhecido",
      registeredOS: "",
      registeredToken: "",
      isRegistered: false,
      isBusy: false,
    };

    this.notificationService = new DemoNotificationService(
      this.onTokenReceived.bind(this),
      this.onNotificationReceived.bind(this),
    );

    this.notificationRegistrationService = new DemoNotificationRegistrationService(
      Config.apiUrl,
      Config.apiKey,
    );
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.isBusy &&
          <ActivityIndicator></ActivityIndicator>
        }
        <View>
      <Text  > "Device Id: "  { this.deviceId } {"\n"}{"\n"}
             "this.state.registeredToken :" { this.state.registeredToken } {"\n"}
             "this.state.registeredOS :" { this.state.registeredOS } {"\n"}
       </Text>
       <Text>
        Config.apiUrl =  {Config.apiUrl}, {"\n"}
      Config.apiKey =  {Config.apiKey}, {"\n"}
       </Text>
        </View>
        <View style={styles.button}>
          <Button title="Registrar" onPress={this.onRegisterButtonPress.bind(this)} disabled={this.state.isBusy} />
        </View>
        <View style={styles.button}>
          <Button title="Cancelar" onPress={this.onDeregisterButtonPress.bind(this)} disabled={this.state.isBusy} />
        </View>
      </View>
    );
  }
 




  async onRegisterButtonPress() {
    if (!this.state.registeredToken || !this.state.registeredOS) {
      Alert.alert("O Token não foi recebido.");
       return;
 
    }

    let status: string = "Registrando...";
    let isRegistered = this.state.isRegistered;
    try {
      //Alert.alert("Tendando registrar.");
      this.setState({ isBusy: true, status });
      const pnPlatform = this.state.registeredOS == "ios" ? "apns" : "fcm";
      const pnToken = this.state.registeredToken;
      const request = {
        installationId: this.deviceId,
        platform: pnPlatform,
        pushChannel: pnToken,
        tags: []
      };
      const response = await this.notificationRegistrationService.registerAsync(request);
      status = `Registered for ${this.state.registeredOS} push notifications`;
      isRegistered = true;
    } catch (e) {
      status = `Registration failed: ${e}`;
    }
    finally {
      this.setState({ isBusy: false, status, isRegistered });
    }
  }

  async onDeregisterButtonPress() {
    if (!this.notificationService)
      return;

    let status: string = "Deregistering...";
    let isRegistered = this.state.isRegistered;
    try {
      this.setState({ isBusy: true, status });
      await this.notificationRegistrationService.deregisterAsync(this.deviceId);
      status = "Deregistered from push notifications";
      isRegistered = false;
    } catch (e) {
      status = `Deregistration failed: ${e}`;
    }
    finally {
      this.setState({ isBusy: false, status, isRegistered });
    }
  }

  onTokenReceived(token: any) {
    console.log(`Received a notification token on ${token.os}`);
    this.setState({ registeredToken: token.token, registeredOS: token.os, status: `The push notifications token has been received.` });

    if (this.state.isRegistered && this.state.registeredToken && this.state.registeredOS) {
      this.onRegisterButtonPress();
    }
  }

  onNotificationReceived(notification: any) {
    console.log(`Received a push notification on ${this.state.registeredOS}`);
    this.setState({ status: `Received a push notification...` });

    if (notification.data.message) {
      Alert.alert(AppConfig.appName, `${notification.data.action} action received`);
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: 'flex-end',
    margin: 50,
  },
  button: {
    margin: 5,
    width: "100%",
  }
});

export default App;