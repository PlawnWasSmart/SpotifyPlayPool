var token = getCookie("token")
const tracksContainer = document.createElement("div")
const authURI = "https://accounts.spotify.com/en/authorize?response_type=token&client_id=a33b8f86908448cc9d546d74711e20e0&scope=playlist-read-private%20playlist-modify-private%20app-remote-control&redirect_uri=http%3A%2F%"+document.location.href+"%2Ftoken%2Ehtml%3Fnoredirect%3Dtrue"
var playpoolTracks;
var playpool;
var playing;



tracksContainer.setAttribute("class","tracks-container")
document.body.appendChild(tracksContainer)

function getCookie(key){
    return document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]+)')?.pop() || ''
}

function newToken(callback){
    var iframe = document.createElement("iframe")
    iframe.src = authURI
    iframe.style = "opacity:0;"
    document.body.appendChild(iframe)
    token = null
    id = setInterval(()=>{
        try{
            iframe.contentWindow.location.href
        } catch(e){
            if(e instanceof DOMException){
                document.body.removeChild(iframe)
                tracksContainer.innerHTML = "<span style='text-align: center;color: #ffffff'>Click <a style='color: #e2e2e2' onclick='newTokenPopUp()'>here</a> to login to your spotify account</span>"
                clearInterval(id)
            }
        }
        if(getCookie("token")){
            token = getCookie("token")
            document.body.removeChild(iframe)
            if(callback!=undefined){
                callback()
            }
            clearInterval(id)
        }
    },1)
}

function newTokenPopUp(){
    let popup = window.open(authURI,"Login to Spotify","height=500,width=400")
    setInterval(()=>{
        if(popup.closed){
            window.location.reload()
        }
    },500)
}

function spotifyGet(endpoint,callback){
    var request = new XMLHttpRequest();
    request.open("GET", "https://api.spotify.com/v1"+endpoint, true);
    if(token){
        request.setRequestHeader("Authorization","Bearer "+token)
    }
    request.setRequestHeader("Content-Type","application/json")
    if(callback!=undefined){
        request.onload = ()=>{
            if(request.status==401){
                newToken(()=>{
                    spotifyGet(endpoint,callback)
                })
            } else{
                callback(request.status,JSON.parse(request.responseText))
            }
        }
    }
    try{
        request.send(null);
    } catch(e){

    }
}

function spotifyPost(endpoint, body, callback){
    var request = new XMLHttpRequest();
    request.open("POST", "https://api.spotify.com/v1"+endpoint, true);
    request.setRequestHeader("Authorization","Bearer "+token)
    request.setRequestHeader("Content-Type","application/json")
    if(callback!=undefined){
        request.onload = ()=>{
            callback(request.status,JSON.parse(request.responseText))
        }
    }
    try{
        request.send(JSON.stringify(body));
    } catch(e){

    }
}

function spotifyPut(endpoint, body, callback){
    var request = new XMLHttpRequest();
    request.open("PUT", "https://api.spotify.com/v1"+endpoint, true);
    request.setRequestHeader("Authorization","Bearer "+token)
    request.setRequestHeader("Content-Type","application/json")
    if(callback!=undefined){
        request.onload = ()=>{
            callback(request.status,JSON.parse(request.responseText))
        }
    }
    try{
        request.send(JSON.stringify(body));
    } catch(e){
        
    }}

function spotifyDelete(endpoint, body, callback){
    var request = new XMLHttpRequest();
    request.open("DELETE", "https://api.spotify.com/v1"+endpoint, true);
    request.setRequestHeader("Authorization","Bearer "+token)
    request.setRequestHeader("Content-Type","application/json")
    if(callback!=undefined){
        request.onload = ()=>{
            callback(request.status,JSON.parse(request.responseText))
        }
    }
    try{
        request.send(JSON.stringify(body));
    } catch(e){
        
    }}

function updatePlayPoolTracks(updateContainer = true){
    spotifyGet("/me/playlists",(code,json)=>{
        for(let item of json.items){
            playpool = undefined
            if(item.name=="PlayPool"){
                playpool = item
                break
            }
        }
        if(playpool==undefined){
            //Create
        }
        spotifyGet("/playlists/"+playpool.id+"/tracks",(code,json)=>{
            playpoolTracks = json
            if(updateContainer){
                clearTracks()
                json.items.sort((a,b)=>a.track.name.localeCompare(b.track.name)).forEach(t=>{
                    addTrack(t.track.id)
                })
            }
        })
    })
}

function clearTracks(){
    tracksContainer.innerHTML = ""
}

function addTrack(id){
    let root = document.createElement("div")
    spotifyGet("/tracks/"+id,(code,track)=>{
        root.setAttribute("class","track")
    
        let trackInfo = document.createElement("div")
        trackInfo.setAttribute("class","track-info")
    
        let icon = document.createElement("img")
        icon.setAttribute("class","track-icon")
        icon.setAttribute("draggable",false)
    
        let name = document.createElement("p")
        name.setAttribute("class","track-name")
    
        let artist = document.createElement("p")
        artist.setAttribute("class","track-artist")
    
        let removeTrackButton = document.createElement("button")
        removeTrackButton.setAttribute("class","remove-track")
        removeTrackButton.textContent = "REMOVE"
        removeTrackButton.addEventListener("click",()=>{
            spotifyDelete("/playlists/"+playpool.id+"/tracks",{
                tracks:[{uri:"spotify:track:"+id}]
            },()=>{
                removeTrack(id)
                updatePlayPoolTracks(false)
            })
        })
    
        icon.src = track.album.images[2].url
    
        name.textContent = track.name
    
        track.artists.forEach(a=>{
            artist.textContent += ", "+a.name
        })
        artist.textContent = artist.textContent.substring(2)
    
        trackInfo.appendChild(name)
        trackInfo.appendChild(artist)
    
        root.trackid = id

        root.appendChild(icon)
        root.appendChild(trackInfo)
        root.appendChild(removeTrackButton)
    })
    tracksContainer.appendChild(root)
}

function removeTrack(id){
    for(child of tracksContainer.children){
        if(child.trackid===id){
            tracksContainer.removeChild(child)
        }
    }
}

function play(){
    spotifyPut("/me/player/play",{
        context_uri: playpoolTracks.uri
    },(code)=>{
        if(code==204){
            document.getElementById("play-button").classList.remove("play")
            document.getElementById("play-bustton").classList.add("pause")
            playing = true
        }
        if(code==403){
            notification("You need Spotify Premium for this to work<br>However, you can still play the playpool by using Spotify app")
        }
    })
}


function pause(){
    spotifyPut("/me/player/pause",null,(code)=>{
        if(code==204){
            document.getElementById("play-button").classList.remove("pause")
            document.getElementById("play-button").classList.add("play")
            playing = false
    
        }
        if(code==403){
            notification("You need Spotify Premium for this to work<br>However, you can still play the playpool by using Spotify app")
        }
    })
}

function togglePlay(){
    if(!playing){
        play()
    } else{
        pause()
    }
}

function hideAddTrackInterface(root){
    root.classList.add("fading-out");
    setTimeout(()=>{
        if(document.body.contains(root)){
            document.body.removeChild(root)
        }
    },50);
}

function showAddTrackInterface(){
    var root = document.createElement("div")
    root.setAttribute("class","add-track-interface")

    var container = document.createElement("div")
    container.setAttribute("class","add-track-interface-container")

    var searchResultsContainer = document.createElement("div")
    searchResultsContainer.setAttribute("class","add-track-interface-search-results-container")

    var topbar = document.createElement("div")
    topbar.setAttribute("class","add-track-interface-topbar")

    var searchBox = document.createElement("input")
    searchBox.setAttribute("class","add-track-interface-search")
    searchBox.setAttribute("type","text")

    searchBox.oninput = ()=>{
        if(searchBox.value.replace(' ','')!=''){
            spotifyGet('/search?q='+searchBox.value+'&type=track',(code,json)=>{
                results = json.tracks.items
                let root = document.createElement("div")
                root.setAttribute("style","margin: 0px;")


                var alltracksid = []
                for(track of playpoolTracks.items){
                    alltracksid.push(track.track.id)
                }
                for(let track of results){
                    if(root.children.length>Math.floor(searchResultsContainer.clientHeight/50)-3){
                        break
                    }
                    let trackRoot = document.createElement("div")
                    trackRoot.setAttribute("class","track")
    
                    let trackInfo = document.createElement("div")
                    trackInfo.setAttribute("class","track-info")
                
                    let icon = document.createElement("img")
                    icon.setAttribute("class","track-icon")
                    icon.setAttribute("draggable",false)
                
                    let name = document.createElement("p")
                    name.setAttribute("class","track-name")
                
                    let artist = document.createElement("p")
                    artist.setAttribute("class","track-artist")
                            
                    icon.src = track.album.images[2].url
                    name.textContent = track.name
                    track.artists.forEach(a=>{
                        artist.textContent += ", "+a.name
                    })
                    artist.textContent = artist.textContent.substring(2)
                
                    trackInfo.appendChild(name)
                    trackInfo.appendChild(artist)

                    let addTrack = document.createElement('button')
                    addTrack.setAttribute("class","add-track-interface-addtrack")
                    if(alltracksid.indexOf(track.id)!==-1){
                        addTrack.textContent = "ADDED"
                        addTrack.classList.add("disabled")
                    } else{
                    addTrack.textContent = "ADD"
                    addTrack.addEventListener("click", ()=>{
                        spotifyPost("/playlists/"+playpool.id+"/tracks",{
                            uris:[track.uri],
                            position:0
                        },()=>{
                            addTrack.textContent = "ADDED"
                        })
                        addTrack.textContent = "ADDING"
                        addTrack.classList.add("disabled")
                        updatePlayPoolTracks()
                    })
                }

                    trackRoot.appendChild(icon)
                    trackRoot.appendChild(trackInfo)
                    trackRoot.appendChild(addTrack)

                    root.appendChild(trackRoot)
                }
    
                searchResultsContainer.innerHTML = ""
                searchResultsContainer.appendChild(root)
            })
        }
    }

    var searchIcon = document.createElement("i")
    searchIcon.setAttribute("class","fa fa-search add-track-interface-search-icon")

    setTimeout(()=>{
        document.addEventListener('click', ()=>{
            hideAddTrackInterface(root)
            document.removeEventListener('click',this)
        })
    
        container.onclick = (e)=>{
            e.stopPropagation()
        }
    },300)


    topbar.appendChild(searchBox)
    topbar.appendChild(searchIcon)

    container.appendChild(topbar)
    container.appendChild(searchResultsContainer)

    root.appendChild(container)
    document.body.appendChild(root)
}

function notification(string){
    let root = document.createElement("div")
    root.setAttribute("class","notification")
    root.innerHTML = string

    document.body.appendChild(root)
    setTimeout(()=>[
        document.body.removeChild(root)
    ],3000)
}

updatePlayPoolTracks()
window.addEventListener('contextmenu',(e)=>{
    e.preventDefault()
})