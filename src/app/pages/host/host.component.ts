import { Component, OnInit } from '@angular/core';
import * as VoxeetSDK from '@voxeet/voxeet-web-sdk';

const CONSUMER_KEY = '';
const CONSUMER_SECRET2 = '=';

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
  public conferenceName = 'dev-portal';
  public name = undefined;
  public message = '';
  public inProgress = false;
  participantsList = [];
  conference: any;
  conferenceStarted = false;

  constructor() { }

  ngOnInit() {

  }

}
