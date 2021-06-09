import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

import * as VoxeetSDK from '@voxeet/voxeet-web-sdk';

const CONSUMER_KEY = environment.consumerKey;
const CONSUMER_SECRET = environment.consumerSecret;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'Podville';
  tabIndex = 0;
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  audio = true;
  callJoined = null;
  videoEnabled = false;
  screenShared = false;
  recordingStarted = false;
  listener = false;

  participantsList = [];

  conferenceStarted = false;

  public conferenceName = 'podville#0001';
  public name = 'Joshua';
  public message = '';
  public inProgress = false;

  constructor(
    private snackBar: MatSnackBar
  ) {

  }

  ngOnInit() {}

  // Videos
  startVideo() {
    this.setInProgress(true);
    VoxeetSDK.conference.startVideo(VoxeetSDK.session.participant)
      .then(() => {
        console.log('Video started successfully for participant: ' + VoxeetSDK.session.participant.info.name);
        navigator.mediaDevices
          .getUserMedia({
            audio: true,
            video: true
          }).then(stream => {
          this.setInProgress(false);
          this.videoEnabled = true;
          this.addVideoNode(VoxeetSDK.session.participant, stream);
        });

      }).catch((e) => {
      console.log('Issue while starting video :' + e);
      this.setInProgress(false);
    });
  }
  leaveVideo(){
    this.setInProgress(true);
    VoxeetSDK.conference.stopVideo(VoxeetSDK.session.participant)
      .then(() => {
        this.removeVideoNode(VoxeetSDK.session.participant);
        this.setInProgress(false);
        this.videoEnabled = false;
        console.log('Video left successfully: ' + VoxeetSDK.session.participant.info.name);
      }).catch((e) => {
      this.setInProgress(false);
      console.log('Error while leaving video: ' + e);
    });
    console.log('Voxeet session object' + VoxeetSDK.session);
  }
  addVideoNode(participant, stream) {
    const videoContainer = document.getElementById('video-container');
    if (videoContainer) {
      let videoNode = document.getElementById('video-' + participant.id) as HTMLVideoElement;
      if (!videoNode) {
        videoNode = document.createElement('video') as HTMLVideoElement;
        videoNode.setAttribute('id', 'video-' + participant.id);
        videoNode.setAttribute('height', String(220));
        videoNode.setAttribute('width', String(300));
        videoNode.setAttribute('class', String('mt-2'));
        videoContainer.appendChild(videoNode);
        videoNode.autoplay = true;
        videoNode.muted = true;
      }
      videoNode.srcObject = stream;
    }
  }
  removeVideoNode(participant) {
    const videoNode = document.getElementById('video-' + participant.id) as HTMLVideoElement;
    const videoNodeUndefined = document.getElementById('video-undefined') as HTMLVideoElement;

    if (videoNode) {
      this.closeCamera(videoNode);
      videoNode.parentNode.removeChild(videoNode);
    }
    if (videoNodeUndefined) {
      this.closeCamera(videoNodeUndefined);
      videoNode.parentNode.removeChild(videoNodeUndefined);
    }
  }
  closeCamera(videoNode) {
    const stream = videoNode.srcObject;
    stream.getVideoTracks().forEach((track) => {
      track.stop();
    });
    videoNode.srcObject = null;
  }



  // Navigate To Host page and to Listener Page
  toHost(){
    if(this.name.length > 0){
      if(this.name == "Joshua" || this.name == "John"){
        this.StartSession();
        this.tabIndex = 1;
      } else {
        this.openSnackBar("Not Authorized to Host...");
      }
    } else {
      this.openSnackBar("Please enter a name");
    }
  }
  toListener(){
    if(this.name.length > 0){
      this.tabIndex = 2;
    } else {
      this.openSnackBar("Please enter a name");
    }
  }
  tabClick(event: any){
    if(event.index == 1){
      this.toHost();
    }else if(event.index == 2){
      this.toListener();
    }
  }

  // Starts/Leave Session of Conference
  createSessionForUser() {
    VoxeetSDK.initialize(CONSUMER_KEY, CONSUMER_SECRET);
    return VoxeetSDK.session.open({name: this.name});
  }
  StartSession() {
    if (this.validateUserAndConferenceName()) {
      this.setInProgress(true);
      this.createSessionForUser()
        .then(() => {
          VoxeetSDK.conference.create({alias: this.conferenceName}, { conferenceOptions: {params: {liveRecording: true}}})
            .then((conference) => {
              VoxeetSDK.conference.join(conference, {constraints: {audio: true, video: false, simulcast: true}})
                .then(() => {
                  this.setInProgress(false);
                  this.callJoined = true;
                })
                .catch((e) => {
                  this.setInProgress(false);
                  console.log('Error while creating conference ' + e);
                });
            });
        });
    }
  }
  leaveSession(){
    this.setDefaultValue();
    if (VoxeetSDK.conference.participants.size) {
      this.setInProgress(true);
      this.stopAudioStream();
      this.openSnackBar('You have left the conference');
      this.tabIndex = 0;
      VoxeetSDK.conference.leave()
        .then(() => {
          this.removeAllParticipantNodes();
          VoxeetSDK.session.close()
            .then(() => {
              this.callJoined = false;
              this.listener = false;
              this.setInProgress(false);
            });
        })
        .catch((e) => {
          console.log('Issue while leaving call:' + e);
          this.setInProgress(false);
        });
    }
  }



  // Audios
  stopAudioStream() {
    navigator.mediaDevices
      .getUserMedia({
        audio: true
      }).then((stream) => {
      if (!stream) {
        return;
      }

      stream.getAudioTracks().forEach((track) => {
        track.stop();
      });

      stream = null;
    });
  }


  // Participants
  removeAllParticipantNodes() {
    this.participantsList = VoxeetSDK.conference.participants;
    this.participantsList.forEach((value, key) => {
      this.removeParticipantNode(value);
    });
  }
  removeParticipantNode(participant) {
    const participantNode = document.getElementById('participant-' + participant.id);

    if (participantNode) {
      this.openSnackBar(`${participant.info.name}` + ' has left the conference');
      participantNode.parentNode.removeChild(participantNode);
    }
  }
  // Validators
  authChecker(mode: string){
    if(this.name.length > 0){
      if(mode == 'host'){
        return !(this.name == "Joshua" || this.name == "John");
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
  validateUserAndConferenceName(): boolean {
    if ( !(this.name.length > 0)) {
      this.openSnackBar('Please provide name');
      return false;
    }
    if (!this.conferenceName) {
      this.openSnackBar('Please check conference name');
      return false;
    }
    return true;
  }


  // General Methods
  reset() {
    this.leaveSession();
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
  openSnackBar(msg: string){
    this.snackBar.open(msg, '', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      duration: 800,
    });
  }

}
