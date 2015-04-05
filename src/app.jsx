var L = require('leaflet');
var mapbox = require('mapbox.js')
var React = require('react')
var Tracks = require('./tracks.js')
var Reflux = require('Reflux')






////Begin Init Map
L.mapbox.accessToken = 'pk.eyJ1IjoiamNtdXNlIiwiYSI6ImVqMmlmeTQifQ.Z4cdYoe1Htq-9aEd5Qnjsw';
var map = L.mapbox.map('map', 'jcmuse.lb4fmb1l', { zoomControl: false }); //load map with tiles
L.control.zoom({ position: 'bottomright' }).addTo(map); //set position of zoom control
////End Init Map

////Get Track Data
var tracks = Tracks.tracks; //Available list of geojson tracks
var trackDir = [
				{id:1,title:'Tampa 1'},
				{id:2,title:'Tampa 2'},
				{id:3,title:'Tampa 3'}
				]
////////////

////Begin Control Playback
var controlPlayback = {
	speed: 150, //playback speed
	path: null, //path layer
	marker: null, //marker layer
	playLoop: null, //setTimeout
	j: null, //coordinate iterator
	activeTrack: null, //track (with coordinates) selected
	trackDone: true, //track done?
	
	loadTrack(trackToLoad) {
		//clear state, load layers
		this.activeTrack = trackToLoad;
		this.j = 0;
		if(this.playLoop) {
			clearTimeout(this.playLoop)
		}
		if(this.marker) {map.removeLayer(this.marker)}
		if(this.path) {map.removeLayer(this.path)}
		this.path = L.geoJson(trackToLoad.geometry).addTo(map);
		this.marker = L.marker([0, 0]).addTo(map);
		map.fitBounds(this.path.getBounds())
		this.playTrack();
		controlPlayback.trackDone = false;
		trackActions.updateTrackDone();
	},
	
	playTrack() { //animate the marker
			if (++this.j < this.activeTrack.geometry.coordinates.length) {
					
					this.playLoop = setTimeout(playLoopLogic => {
					// Set the marker to be at the same point as one
					// of the segments or the line.
					this.marker.setLatLng(
					L.latLng(
						this.activeTrack.geometry.coordinates[this.j][1],
						this.activeTrack.geometry.coordinates[this.j][0])
					);
						this.playTrack(); //do it again
					}, 200-this.speed)
			}
			else {
				this.j = 0;
				clearTimeout(this.playLoop);
				controlPlayback.trackDone = true;
				trackActions.updateTrackDone();
			}

	},
	pauseTrack() { //pause animation
		if(this.playLoop) {
			clearTimeout(this.playLoop);
		}
	}
}
////End Control Playback





//Track actions
var trackActions = Reflux.createActions(
    ["updateTrackDone"]
)
//Track store
var trackStore = Reflux.createStore({
	listenables: [trackActions],

    onUpdateTrackDone(){
        this.trigger({trackDone: controlPlayback.trackDone});
    },
	getInitialState() {
		return {trackDone: controlPlayback.trackDone}
	}
});

//Speed actions
var speedActions = Reflux.createActions(
    ["updateSpeed"]
)
//Speed store
var speedStore = Reflux.createStore({
	listenables: [speedActions],

    onUpdateSpeed(){
        this.trigger({speed: controlPlayback.speed});
    },
	getInitialState() {
		return {speed: controlPlayback.speed}
	}
});

//React Components
var TrackItem = React.createClass({
 	clickTrack() {
    	this.props.clickTrack(this);
  	}, 
	render() {
		console.log('rendiner track item')
		return (
		<li>
			<a onClick={this.clickTrack} href="#">{this.props.track.title}
				<span className={'glyphicon glyphicon-' + this.props.glyph} 
				style={{fontSize: '1.3em', lineHeight: '40px', verticalAlign:'middle',display: 'relative', float:'right', paddingRight: '10px', }}>
				</span>
			</a>
		</li>
		)
	}
});

var TrackList = React.createClass({
	mixins: [Reflux.connect(trackStore)],

	getInitialState() {
		return {activeTrack: {playing: false, id: null, glyph: 'play'}}
	},
	clickTrack(trackItem) {
		if(this.state.activeTrack.id && trackItem.props.track.id == this.state.activeTrack.id && !this.state.trackDone) {
			if(this.state.activeTrack.playing) {
			controlPlayback.pauseTrack();
			this.setState({activeTrack: {playing: false, id: trackItem.props.track.id, glyph: 'play'}})
			}
			else {
			controlPlayback.playTrack(); 
			this.setState({activeTrack: {playing: true, id: trackItem.props.track.id, glyph: 'pause'}})
			}			
		}
		else {
			controlPlayback.loadTrack(tracks[trackItem.props.track.id-1])
			this.setState({activeTrack: {playing: true, id: trackItem.props.track.id, glyph: 'pause'}})
		}
	},
	getGlyph() {
		if(this.state.trackDone) {
			return 'repeat'
		} else {
			return this.state.activeTrack.glyph
		}
	},
	renderTracks() {
		return trackDir.map((track,index) => {
			return (<TrackItem glyph={track.id == this.state.activeTrack.id ? this.getGlyph() : null} clickTrack={this.clickTrack} track={track} key={index}/>)
		});
	},
	render() {
		console.log('rendering track list')
		return <ul className="sidebar-nav">{this.renderTracks()}</ul>
	}
});

var SideBar = React.createClass({

	mixins: [Reflux.connect(speedStore)],

	updateSpeed(event) {
		controlPlayback.speed = event.target.value;
		speedActions.updateSpeed();
	},

	render() {
		return (
			<div>

			<ul className="sidebar-nav">
				<li className="sidebar-brand">
						Tripbax
				</li>
				 <li style={{marginTop: '-25px'}} className="sidebar-slogan">
					   <small>set playback speed</small>
				</li>	
				<li style={{marginTop: '-5px'}}>
					<input onChange={this.updateSpeed} id="playback-speed" value={this.state.speed} type="range" min="1" max="200" step="5"/>
				</li>
			</ul>
			
			<TrackList/>
			</div>
		);
	}
});


//Render it
React.render(<SideBar/>, document.getElementById('sidebar-wrapper'));



	
