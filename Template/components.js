const keyColorObject = new THREE.Color(0xd432);

const vertexShader = [
	"varying vec2 vUv;",
	"void main(void)",
	"{",
	"vUv = uv;",
	"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
	"gl_Position = projectionMatrix * mvPosition;",
	"}",
].join("\n");

const fragmentShader = [
	"uniform sampler2D texture;",
	"uniform vec3 color;",
	"varying vec2 vUv;",
	"void main(void)",
	"{",
	"vec3 tColor = texture2D( texture, vUv ).rgb;",
	"float a = (length(tColor - color) - 0.5) * 7.0;",
	"gl_FragColor = vec4(tColor, a);",
	"}",
].join("\n");

const loader = new THREE.TextureLoader();

class Video {
	constructor({
		name,
		src,
		scene,
		greenScreen,
		subtitles,
		scale,
		orientation,
	}) {
		this.video = document.createElement("video");
		this.video.src = src;
		this.video.setAttribute("id", name);
		this.video.setAttribute("preload", "auto");
		this.video.setAttribute("playsinline", "");
		this.video.setAttribute("webkit-playsinline", "");

		this.texture = new THREE.VideoTexture(this.video);
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;
		this.texture.format = THREE.RGBAFormat;
		this.texture.crossOrigin = "anonymous";

		this.subtitles = subtitles;
		this.orientation = orientation;
		this.scale = scale;
		this.subtitle = document.getElementById("subtitle");

		if (greenScreen) {
			this.videoMaterial = new THREE.ShaderMaterial({
				uniforms: {
					texture: {
						type: "t",
						value: this.texture,
					},
					color: {
						type: "c",
						value: keyColorObject,
					},
				},
				vertexShader,
				fragmentShader,
				transparent: true,
			});
		} else {
			this.videoMaterial = new THREE.MeshBasicMaterial({ map: this.texture });
		}

		this.videoMaterial.side = THREE.DoubleSide;

		this.videoObj = new THREE.Mesh(
			new THREE.PlaneGeometry(1, 1),
			this.videoMaterial
		);
		scene.add(this.videoObj);

		this.videoObj.visible = false;
		this.video.load();
	}

	showVideo({ posX, posZ, rotX, rotY, rotZ }) {
		if (this.orientation === "landscape") {
			this.scaleX = this.scale * 1.77;
			this.scaleY = this.scale;
		} else if (this.orientation === "portrait") {
			this.scaleX = this.scale;
			this.scaleY = this.scale * 1.77;
		}

		this.posY = this.scaleY / 2 - 2;

		this.video.play();
		this.videoObj.visible = true;
		this.videoObj.position.set(posX, this.posY, posZ);
		this.videoObj.rotation.set(rotX, rotY, rotZ);
		this.videoObj.scale.set(this.scaleX, this.scaleY, this.scale);
	}

	pauseVideo() {
		this.video.pause();
	}

	playVideo() {
		this.video.play();
	}

	hideVideo() {
		this.video.pause();
		this.video.currentTime = 0;
		this.videoObj.visible = false;
	}

	playAudio(audio) {
		this.video.onended = () => {
			setTimeout(() => {
				document.getElementById("charlieTap").style.display = "block";

				audio.play();
			}, 1000);
		};
	}

	addSubtitles() {
		this.currTime = this.video.currentTime * 1000;
		for (let i = 0; i < this.subtitles.length; i++) {
			this.timeIn = this.subtitles[i].timein;
			this.timeOut = this.subtitles[i].timeout;

			if (this.currTime >= this.timeIn && this.currTime <= this.timeOut) {
				this.subtitle.innerHTML = this.subtitles[i].text;
			}
		}
	}

	updateRotation(camera) {
		this.yRotation = Math.atan2(
			camera.position.x - this.videoObj.position.x,
			camera.position.z - this.videoObj.position.z
		);
		this.videoObj.rotation.y = this.yRotation;
	}
}

class Image {
	constructor({ src, scene, width, height }) {
		this.material = new THREE.MeshBasicMaterial({
			map: loader.load(src),
			transparent: true,
		});

		this.imgObj = new THREE.Mesh(
			new THREE.PlaneGeometry(width, height),
			this.material
		);

		this.imgObj.visible = false;

		scene.add(this.imgObj);
	}

	showImage(marker) {
		this.imgObj.visible = true;
		this.imgObj.position.set(
			marker.position.x,
			marker.position.y,
			marker.position.z
		);
		this.imgObj.quaternion.copy(marker.rotation);
		this.imgObj.scale.set(marker.scale, marker.scale, marker.scale);
	}

	hideImage() {
		this.imgObj.visible = false;
	}
}

const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();

class Audio {
	constructor({ src, subtitles }) {
		this.sound = new THREE.Audio(listener);

		audioLoader.load(src, (buffer) => {
			this.sound.setBuffer(buffer);
			this.sound.setLoop(false);
			this.sound.setVolume(2);
		});

		this.subtitles = subtitles;
		this.subtitle = document.getElementById("subtitle");
	}

	play() {
		this.sound.play();
	}

	stopPlaying() {
		this.sound.stop();
	}

	addSubtitles() {
		this.currTime = this.sound.currentTime * 1000;
		for (let i = 0; i < this.subtitles.length; i++) {
			this.timeIn = this.subtitles[i].timein;
			this.timeOut = this.subtitles[i].timeout;

			if (this.currTime >= this.timeIn && this.currTime <= this.timeOut) {
				this.subtitle.innerHTML = this.subtitles[i].text;
			}
		}
	}
}
