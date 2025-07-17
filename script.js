let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a;
    try {
        a = await fetch(`/${folder}/`);
        if (!a.ok) throw new Error("Fetch failed for folder");
    } catch (err) {
        console.error("Error fetching songs folder:", err);
        return;
    }


    let response = await a.text()
    let div = document.createElement("div")
    div.innerHTML = response
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }

    // Showing all the songs in the PLaylist :

    let songsUL = document.querySelector(".songslist").getElementsByTagName("ul")[0]
    songsUL.innerHTML = ""
    for (const song of songs) {
        songsUL.innerHTML = songsUL.innerHTML + `<li><img class="invert" src="/Images/Svg's/music.svg" alt="">
                            <div class="info">
                                <div class="multicolor-text" >${decodeURIComponent(song.replace(".mp3", ""))}</div>
                            </div>

                                <img class="invert" src="/Images/Svg's/play.svg" alt="">
 </li>`;
    }



    // Attach an event listener to each song : 

    Array.from(document.querySelector(".songslist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim() + ".mp3")
        })
    })

    return songs
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;

    if (!pause) {
        currentSong.play().then(() => {
            play.src = "/Images/Svg's/pause.svg";
        }).catch(error => {
            // Suppress the AbortError or log it if needed :
            if (error.name !== "AbortError") {
                console.error("Play error:", error);
            }
        });
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track.replace(".mp3", ""))
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
}



async function displayAlbums() {
    let a;
    try {
        a = await fetch(`/songs/`);
        if (!a.ok) throw new Error("Fetch failed for /songs/");
    } catch (err) {
        console.error("Error fetching album root folder:", err);
        return;
    }


    let response = await a.text()
    let div = document.createElement("div")
    div.innerHTML = response
    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector(".cardContainer")
    let array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0]

            // Get the metadata of the folder : 

            let a;
            try {
                a = await fetch(`/songs/${folder}/info.json`);
                if (!a.ok) throw new Error("Missing info.json");
            } catch (err) {
                console.warn(`Skipping album "${folder}":`, err);
                continue; // skip this card
            }


            let response = await a.json()
            cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="18" height="18" viewBox="-1 0.5 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${response.title}</h2>
                        <p>${response.description}</p>
                    </div>`
        }
    }

    // Load the Playlist whenever the card is clicked : 

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
            playMusic(songs[0])

            // Show sidebar if screen is small :

            if (window.innerWidth <= 1000) {
                document.querySelector(".left").style.left = "0";
            }

        })
    })
}


async function main() {

    // get the list of all the songs...

    await getSongs("songs/ncs")
    playMusic(songs[0], true)


    // Display all the albums on the page : 

    displayAlbums()


    // Attach an event listener to play, next and previous 

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "/Images/Svg's/pause.svg"
        }
        else {
            currentSong.pause()
            play.src = "/Images/Svg's/play.svg"
        }
    })

    // Listen for timeupdate event : 

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"
    })

    // Add an EventListener to seekbar : 

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%"
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // Add an EventListener for hamburger : 

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    // Add an EventListener for close button : 

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    // Add an EventListener to Previous : 

    previous.addEventListener("click", () => {
        currentSong.pause()
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
        else {
            playMusic(songs[songs.length - 1])
        }
    })

    // Add an EventListener to next : 

    next.addEventListener("click", () => {
        currentSong.pause()
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
        else {
            playMusic(songs[0])
        }
    })

    // Auto-play next song when current ends :

    currentSong.addEventListener("ended", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            // Optional: repeat from first song
            playMusic(songs[0]);
        }
    });

    // play, Pause, Next and Previous using keys on keyboard :

    document.body.onkeydown = e => {
        if (e.code === "Space") {
            e.preventDefault();
            play.click();
        }
        if (e.code === "ArrowRight") next.click();
        if (e.code === "ArrowLeft") previous.click();
    };

}

main()