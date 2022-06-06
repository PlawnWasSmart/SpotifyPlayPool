const hashParams = new URLSearchParams(window.location.hash.substring(1))
const params = new URLSearchParams(window.location.search)
document.cookie = "token="+hashParams.get("access_token") + "; max-age="+ hashParams.get("expires_in")
if(params.get("noredirect")==="true"){
    window.close()
} else{
    window.location.href = "/index.html"
}

//https://accounts.spotify.com/en/authorize?response_type=token&client_id=a33b8f86908448cc9d546d74711e20e0&scope=playlist-read-private%20playlist-modify-private%20app-remote-control&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Ftoken%2Ehtml