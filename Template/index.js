// initialize your global variables here
const onxrloaded = () => {
	const initXrScene = ({ scene, camera, renderer }) => {
		renderer.shadowMap.enabled = true;

		camera.position.set(0, 2, 0);
	};

	// if you want to disable word tracking, uncomment below:
	// XR8.XrController.configure({disableWorldTracking: true})

	XR8.addCameraPipelineModules([
		// Existing pipeline modules.
		XR8.GlTextureRenderer.pipelineModule(), // Draws the camera feed.
		XR8.Threejs.pipelineModule(), // Creates a ThreeJS AR Scene.
		XR8.XrController.pipelineModule(), // Enables SLAM tracking.
		XRExtras.AlmostThere.pipelineModule(), // Detects unsupported browsers and gives hints.
		XRExtras.FullWindowCanvas.pipelineModule(), // Modifies the canvas to fill the window.
		XRExtras.RuntimeError.pipelineModule(), // Shows an error image on runtime error.
		XRExtras.Loading.pipelineModule(), // Manages the loading screen on startup.
	]);

	XR8.addCameraPipelineModule({
		// Camera pipeline modules need a name. It can be whatever you want but must be unique within
		// your app.
		name: "myawesomeapp",

		// onStart is called once when the camera feed begins. In this case, we need to wait for the
		// XR8.Threejs scene to be ready before we can access it to add content. It was created in
		// XR8.Threejs.pipelineModule()'s onStart method.
		onStart: ({ canvas }) => {
			// Get the 3js sceen from xr3js.
			const { scene, camera, renderer } = XR8.Threejs.xrScene();

			// Add some objects to the scene and set the starting camera position.
			initXrScene({ scene, camera, renderer });

			// prevent scroll/pinch gestures on canvas
			canvas.addEventListener("touchmove", (event) => {
				event.preventDefault();
			});

			// Sync the xr controller's 6DoF position and camera paremeters with our scene.
			XR8.XrController.updateCameraProjectionMatrix({
				origin: camera.position,
				facing: camera.quaternion,
			});
		},

		// onUpdate is called once per camera loop prior to render. Any 3js geometry scene
		// would typically happen here.
		onUpdate: () => {},
	});

	const canvas = document.getElementById("camerafeed");
	// Call XrController.recenter() when the canvas is tapped with two fingers. This resets the
	// ar camera to the position specified by XrController.updateCameraProjectionMatrix() above.
	canvas.addEventListener(
		"touchstart",
		(e) => {
			e.touches.length == 1 && XR8.XrController.recenter();
		},
		true
	);

	// Open the camera and start running the camera run loop.
	XR8.run({ canvas });
};

window.onload = () => {
	window.XR ? onxrloaded() : window.addEventListener("xrloaded", onxrloaded);
};
