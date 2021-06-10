import { Component, OnInit, ɵɵsetComponentScope } from '@angular/core';
import { environment } from '../environments/environment';
import { Participant } from './models/participant';
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
  recordingStarted = false;
  listener = false;

  public participantsList: Participant[] = [];
  public user: Participant;
  public hostNames: string[] = [];
  conference: any;
  conferenceStarted = false;

  public conferenceName = 'podville#3412';
  public name = '';
  public message = '';
  public inProgress = false;

  constructor(
    private snackBar: MatSnackBar
  ) {
    VoxeetSDK.conference.on('streamAdded', (participant, stream) => {
      console.log('Stream Added with participant id: ' + participant.id + ' with stream type: ' + this.fetchStreamStype(stream));
      if (stream.getVideoTracks().length) {
        this.addVideoNode(participant, stream);
      }
    });

    VoxeetSDK.conference.on('streamRemoved', (participant, stream) => {
      console.log('Stream removed with participant id:' + participant.id + ' with stream type: ' + this.fetchStreamStype(stream));
      if (stream.getVideoTracks().length) {
        this.removeVideoNode(participant);
      }
      if (stream.getAudioTracks().length) {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
          track = null;
        });
        this.removeParticipantNode(participant);
      }
    });

    VoxeetSDK.conference.on('streamUpdated', (participant, stream) => {
      console.log('streamUpdated with participant id: ' + participant.id + ' with stream type: ' + this.fetchStreamStype(stream));
      this.showAllVideoParticipants();
      if (!participant.streams[0].getVideoTracks().length) {
        this.removeVideoNode(participant);
      }
    });

    VoxeetSDK.conference.on('participantAdded', (participant, stream) => {
      console.log('participantAdded with participant id' + participant.id + ' with stream type: ' + this.fetchStreamStype(stream));
      if(participant.status !== 'Left'){
        this.addParticipantNode(participant);
      }
      this.conferenceStarted = VoxeetSDK.conference.participants.length > 0;
    });

    VoxeetSDK.conference.on('participantUpdated', (participant, stream) => {
      console.log('participantUpdated with participant id' + participant.id + ' with stream type: ' + this.fetchStreamStype(stream));
      console.log(participant);
      if (participant.status === 'Left') {
        this.removeParticipantNode(participant);
      }
    });

    VoxeetSDK.notification.on('ended', (participant, stream) => {
      console.log('Conference has ended' + participant.info.name);
      this.removeAllParticipantNodes();
      this.reset();
    });
    VoxeetSDK.conference.on("error", (error) => {
      console.log('Conference error' + error);
    });
  }

  ngOnInit() {}

  // Audio
  muteYourself() {
    this.setInProgress(true);
    if (!this.audio) {
      VoxeetSDK.conference.startAudio(VoxeetSDK.session.participant)
        .then(() => {
          console.log('audio stream started');
          this.setInProgress(false);
        }).catch((e) => {
        this.setInProgress(false);
        console.log('Error while starting audio' + e);
      });
    } else {
      VoxeetSDK.conference.stopAudio(VoxeetSDK.session.participant)
        .then(() => {
          console.log('audio stream stopped');
          this.setInProgress(false);
        }).catch((e) => {
        this.setInProgress(false);
        console.log('Error while stopping audio' + e);
      });
    }

    this.audio = !this.audio;
  }

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
        videoNode.style.padding = "10px";
        videoContainer.appendChild(videoNode);
        let textNode = document.createElement('p') as HTMLParagraphElement;
        textNode.setAttribute('id', 'text-' + participant.id);
        textNode.textContent = participant.info.name;
        textNode.style.display = "inline";
        videoContainer.appendChild(textNode);
        videoNode.autoplay = true;
        videoNode.muted = true;
      }
      videoNode.srcObject = stream;
    }
  }
  removeVideoNode(participant) {
    const videoNode = document.getElementById('video-' + participant.id) as HTMLVideoElement;
    const videoNodeUndefined = document.getElementById('video-undefined') as HTMLVideoElement;
    const textNode = document.getElementById('text-' + participant.id) as HTMLParagraphElement;
    const textNodeUndefined = document.getElementById('text-undefined') as HTMLParagraphElement;

    if (videoNode) {
      this.closeCamera(videoNode);
      videoNode.parentNode.removeChild(videoNode);
      textNode.parentNode.removeChild(textNode);
    }
    if (videoNodeUndefined) {
      this.closeCamera(videoNodeUndefined);
      videoNode.parentNode.removeChild(videoNodeUndefined);
      textNode.parentNode.removeChild(textNodeUndefined);
    }
  }
  closeCamera(videoNode) {
    const stream = videoNode.srcObject;
    stream.getVideoTracks().forEach((track) => {
      track.stop();
    });
    videoNode.srcObject = null;
  }

  // Listener
  joinAsListener(){
    if (VoxeetSDK.conference.participants.length) {
      VoxeetSDK.session.close();
    }
    if(this.validateUserAndConferenceName()) {
      this.setInProgress(true);
      this.createSessionForUser()
        .then(() => {
          VoxeetSDK.conference.create({alias: this.conferenceName})
            .then((conference) => {
              VoxeetSDK.conference.listen(conference)
                .then((res) => {
                  console.log('Listening conference');
                  this.callJoined = true;
                  this.listener = true;
                  this.setInProgress(false);

                  //Add to participant list
                  this.user = new Participant();
                  this.user.id = VoxeetSDK.session.participant.id;
                  this.user.name = VoxeetSDK.session.participant.info.name;
                  this.user.type = "listener"
                  this.user.isSessionUser = true;
                  this.participantsList.push(this.user);
                  console.log('user', this.user);
                })
                .catch(e => {
                  console.log('Listening conference failed' + e);
                  this.setInProgress(false);
                });
            });
        });
    }
  }
  addParticipantNode(participant) {
    if (participant.id === VoxeetSDK.session.participant.id) {
      return;
    }
    let tempUser = new Participant();
    tempUser.id = participant.id;
    tempUser.name = participant.info.name;
    tempUser.type = participant.type;
    tempUser.isSessionUser = false;
    console.log('tempUser', tempUser)
    console.log('participantToAdd', participant);

    this.participantsList.push(tempUser);
  }


  // Navigate To Host page and to Listener Page
  toHost(){
    if(this.name.length > 0){
      if(this.name === "Joshua" || this.name === "John"){
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
      this.joinAsListener()
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

                  //Add to participant list
                  this.user = new Participant();
                  this.user.id = VoxeetSDK.session.participant.id;
                  this.user.name = VoxeetSDK.session.participant.info.name;
                  this.user.type = VoxeetSDK.session.participant.type;
                  this.user.isSessionUser = true;
                  this.participantsList.push(this.user);
                  console.log('user', this.user);
                })
                .catch((e) => {
                  this.setInProgress(false);
                  console.log('Error while creating conference ' + e);
                });
            });
        });
    }
  }
  fetchStreamStype(stream) {
    if (stream) {
      return stream.type ? stream.type : 'Audio';
    }
    return 'No stream available';
  }
  leaveSession(){
    console.log('Leaving session');
    this.setDefaultValue();
    if (VoxeetSDK.conference.participants.size) {
      this.setInProgress(true);
      this.stopAudioStream();
      this.openSnackBar('You have left the conference');
      this.tabIndex = 0;
      VoxeetSDK.conference.leave()
        .then(() => {
          VoxeetSDK.session.close()
            .then(() => {
              this.removeAllParticipantNodes();
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
  endConference(){
    // Not method to end conference?
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
    this.participantsList = [];
  }

  removeParticipantNode(participant) {
    this.participantsList = this.participantsList.filter(x => x.id !== participant.id);
    this.openSnackBar(`${participant.info.name}` + ' has left the conference');
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
  private showAllVideoParticipants() {
    let tempList = VoxeetSDK.conference.participants;
    tempList.forEach((value, key) => {
      if (value.id !== VoxeetSDK.session.participant.id
      ) {

        if (value.streams[0] && value.streams[0].getVideoTracks().length) {
          this.addVideoNode(value, value.streams[0]);
          return;
        }

      }
    });
  }

}
