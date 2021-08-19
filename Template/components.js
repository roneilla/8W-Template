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

	showVideo({ detail, posX, posZ, rotX, rotY, rotZ }) {
		if (this.orientation === "landscape") {
			this.scaleX = this.scale * 1.77;
			this.scaleY = this.scale;
		} else if (this.orientation === "portrait") {
			this.scaleX = this.scale;
			this.scaleY = this.scale * 1.77;
		} else if (this.orientation === "square") {
			this.scaleX = this.scale;
			this.scaleY = this.scale;
		}

		if (detail) {
			this.videoObj.position.copy(detail.position);
			this.videoObj.quaternion.copy(detail.rotation);
			this.videoObj.scale.set(
				detail.scale * this.scaleX,
				detail.scale * this.scaleY,
				detail.scale
			);
		} else {
			this.posY = this.videoObj.height / 2;
			this.videoObj.position.set(posX, this.posY, posZ);
			this.videoObj.rotation.set(rotX, rotY, rotZ);
			this.videoObj.scale.set(this.scaleX, this.scaleY, this.scale);
		}
		this.videoObj.visible = true;
	}

	isPlaying() {
		if (
			this.video.currentTime > 0 &&
			!this.video.paused &&
			!this.video.ended &&
			this.video.readyState > 2
		) {
			return true;
		} else {
			return false;
		}
	}

	pauseVideo() {
		this.video.pause();
		console.log("pausing");
	}

	playVideo() {
		this.video.play();
	}

	hideVideo() {
		this.video.pause();
		this.video.currentTime = 0;
		this.videoObj.visible = false;
	}

	playAudio(audio, timeout) {
		this.video.onended = () => {
			setTimeout(() => {
				audio.play();
			}, timeout);
		};
	}

	showSubtitles(subtitleContainer) {
		subtitleContainer.style.display = "block";
		this.currTime = this.video.currentTime * 1000;
		for (let i = 0; i < this.subtitles.length; i++) {
			this.timeIn = this.subtitles[i].timein;
			this.timeOut = this.subtitles[i].timeout;

			if (this.currTime >= this.timeIn && this.currTime <= this.timeOut) {
				subtitleContainer.innerHTML = this.subtitles[i].text;
			}
		}
	}

	hideSubtitles(subtitleContainer) {
		subtitleContainer.style.display = "none";
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
	constructor({ src, scene, width, height, scale }) {
		this.material = new THREE.MeshBasicMaterial({
			map: loader.load(src),
			transparent: true,
		});

		this.imgObj = new THREE.Mesh(
			new THREE.PlaneGeometry(width, height),
			this.material
		);

		this.scale = scale;

		this.imgObj.visible = false;

		scene.add(this.imgObj);
	}

	showImage({ detail, posX, posY, posZ, rotX, rotY, rotZ }) {
		if (detail) {
			this.imgObj.position.copy(detail.position);
			this.imgObj.quaternion.copy(detail.rotation);
			this.imgObj.scale.set(detail.scale, detail.scale, detail.scale);
		} else {
			this.videoObj.position.set(posX, posY, posZ);
			this.videoObj.rotation.set(rotX, rotY, rotZ);
			this.videoObj.scale.set(this.scale, this.scale, this.scale);
		}
		this.imgObj.visible = true;
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
