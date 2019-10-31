import React, {Component} from 'react';
import VideoPlayer from 'react-video-js-player';
import { API, graphqlOperation } from 'aws-amplify';
import {Grid, Col, Row} from 'react-styled-flexboxgrid';
import {Modal, ModalBody, ModalHeader} from 'reactstrap';
import { onCreateVodAsset } from '../../graphql/subscriptions';
import './index.css';
import GridCardView from './../GridCardView'
import * as queries from '../../graphql/queries';
import BottomScrollListener from 'react-bottom-scroll-listener'

class GridView extends Component {
  constructor(props){
    super(props);
    this.state = {
      displayingMovie:false,
      url:"",
      choosenItem:{},
      value:"",
      nextToken:"",
      items:[{id:1, title:"Steve Jobs Speech", details:"None", url:"http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8"}]
    
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleOnDocumentBottom = this.handleOnDocumentBottom.bind(this);
  }
  handleChange(event) {
    this.setState({value: event.target.value});
  }
  handleSubmit(event) {
    this.playURL(this.state.value)
    event.preventDefault();
  }
  async componentDidMount(){
    const allTodos = await API.graphql(graphqlOperation(queries.listVodAssets));
    var nextToken = allTodos.data.listVodAssets.nextToken;
    if(nextToken == undefined){
      nextToken = "";
    }
    this.setState({items: allTodos.data.listVodAssets.items, nextToken: nextToken})
    this.listenForNewAssets();
  }

  async handleOnDocumentBottom(){
    console.log('I am at bottom! ' + Math.round(performance.now()))
    console.log(this.state.nextToken);
    if(this.state.nextToken !== "" && this.state.nextToken !== undefined){
      const allTodos = await API.graphql(graphqlOperation(queries.listVodAssets,{nextToken:this.state.nextToken}));
      var items = this.state.items.concat(allTodos.data.listVodAssets.items);
      console.log(this.state.token);
      var nextToken = allTodos.data.listVodAssets.nextToken;
      if(nextToken == undefined){
        nextToken = "";
      }
      this.setState({items: items, nextToken: nextToken});

    }
  }
  displayMovie = (item, e) =>{
    this.setState({
      displayingMovie:true,
      choosenItem:item
    })
  }

  playURL = (link) => {
    console.log("clicked");
    this.setState({
      url:link
    }, () => {
      if (!!this.player) {
        this.player.src(this.state.url)
        console.log("hello")
      }
    });

    console.log(this.state.url);
  }

  hideMovie = () => {
    console.log("hide");
    this.setState({
      displayingMovie:false
    });
  }

  onPlayerReady(player){
    console.log("Player is ready: ", player);
    this.player = player;
  }

  overlayMovie = () => {
    return (
    <Modal id='popup' style={{maxWidth: 800}} isOpen={this.state.displayingMovie} toggle={this.hideMovie}>
      <ModalHeader  toggle={this.hideMovie}>{this.state.choosenItem.title}</ModalHeader>
      <ModalBody>
        {this.state.choosenItem.details}
            <div>
                <VideoPlayer
                    controls={true}
                    src={this.state.choosenItem.url}
                    width="720"
                    height="420"
                    onReady={this.onPlayerReady.bind(this)}
                />
            </div>
            <div>
              Input Url Here: <input type="text" value={this.state.value} name="contentURL" onChange={this.handleChange}></input>
              <button onClick={e => this.handleSubmit(e)}>submit</button>
            </div>
      </ModalBody>
    </Modal>
    );
  }

  listenForNewAssets = () => {
    API.graphql(
      graphqlOperation(onCreateVodAsset)
    ).subscribe({
      next: (((data) => {
        console.log(data.value.data.onCreateVodAsset);
        console.log("RIP");
        var newItemList = this.state.items.push(data.value.data.onCreateVodAsset);
        console.log(newItemList);
        this.setState({
            //items:newItemList
        });
      }).bind(this))
    })
  }


  render(){
    const items = this.state.items.map((item, key) =>
      <Col xs={6} sm={3} lg={2} style={{paddingTop:5, paddingBottom:5}}>
        <button onClick={(e) => this.displayMovie(item, e)}><GridCardView item={item}></GridCardView></button>
      </Col>
    );
    
    //https://github.com/LoicMahieu/react-styled-flexboxgrid

  
    return (
      <div style={{paddingTop:85}}>
        {this.overlayMovie()}
        <BottomScrollListener onBottom={this.handleOnDocumentBottom} />
        <Grid fluid={true}>
          <Row>
            {items}
          </Row>
        </Grid>
      </div>
    );
  }
}

export default GridView;
