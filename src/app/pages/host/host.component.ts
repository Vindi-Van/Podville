import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

import * as VoxeetSDK from '@voxeet/voxeet-web-sdk';

const CONSUMER_KEY = environment.consumerKey;
const CONSUMER_SECRET = environment.consumerSecret;

@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit {

  audio = true;
  callJoined = null;
  videoEnabled = false;
  screenShared = false;
  recordingStarted = false;
  listener = false;

  participantsList = [];

  conferenceStarted = false;

  public conferenceName = 'podville#0001';
  public name = undefined;
  public message = '';
  public inProgress = false;

  conference: any;

  constructor() {


  }

  ngOnInit() {

  }

  createSessionForUser() {
    VoxeetSDK.initialize(CONSUMER_KEY, CONSUMER_SECRET);
    return VoxeetSDK.session.open({name: this.name});
  }

  createConference(conferenceID?: string) {
    VoxeetSDK.conference.create({alias: conferenceID || this.conferenceName})
      .then((conference) => {
        this.conference = conference;
        console.log('conference created with id: ' + conference.id);
      }).catch((e) => {
      this.setInProgress(false);
      console.log('Error while creating conference ' + e);
    });
  }


  //Host Commands
  removeAllParticipantNodes() {
    this.participantsList = VoxeetSDK.conference.participants;
    this.participantsList.forEach((value, key) => {
      //this.removeParticipantNode(value);
    });
  }




  setInProgress(value: boolean) {
    this.inProgress = value;
  }

  setDefaultValue() {
    this.videoEnabled = false;
    this.audio = true;
    this.callJoined = false;
    this.screenShared = false;
    this.recordingStarted = false;
    this.setInProgress(false);
  }

}
