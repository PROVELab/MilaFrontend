import React, {
  Suspense,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Platform, View, StyleSheet, Text, Button } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei/native";
import { Asset } from "expo-asset";
import * as THREE from "three";

function Model({ onSceneLoaded, ...props }) {
  const gltfUri = Asset.fromModule(require("../../assets/porsche.glb")).uri;
  const { scene } = useGLTF(gltfUri);

  // Notify the parent when the scene is loaded
  useEffect(() => {
    if (scene && onSceneLoaded) {
      onSceneLoaded(scene);
    }
  }, [scene, onSceneLoaded]);

  return <primitive {...props} object={scene} />;
}

const Sphere = React.memo(({ position, onClick, color }) => {
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onClick(e);
    },
    [onClick],
  );

  return (
    <mesh position={position} onClick={handleClick}>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
});

// Helper component to update tooltip position
const PositionTracker = ({ position, onUpdate }) => {
  const { camera, size } = useThree();

  useFrame(() => {
    const vector = new THREE.Vector3(...position);
    vector.project(camera);

    const x = (vector.x * size.width) / 2 + size.width / 2;
    const y = -((vector.y * size.height) / 2) + size.height / 2;

    // Only update if point is in front of the camera (z < 1)
    if (vector.z < 1) {
      onUpdate([x, y]);
    } else {
      onUpdate(null); // Hide tooltip when point is behind camera
    }
  });

  return null;
};

const TooltipOverlay = ({ text, position }) => {
  if (!text || !position) return null;

  return (
    <View
      style={[styles.tooltipContainer, { left: position[0], top: position[1] }]}
    >
      <View style={styles.tooltipBubble}>
        <Text style={styles.tooltipText}>{text}</Text>
      </View>
      <View style={styles.tooltipArrow} />
    </View>
  );
};

function ThreeScene() {
  const [tooltip, setTooltip] = useState(null);
  const [screenPosition, setScreenPosition] = useState(null);
  const [sphereColor, setSphereColor] = useState("red");

  const sceneRef = useRef(null);

  const handleSphereClick = useCallback((e, text, position) => {
    e.stopPropagation();
    setTooltip({ text, position });
  }, []);

  const handleCanvasClick = useCallback(() => {
    requestAnimationFrame(() => {
      setTooltip(null);
      setScreenPosition(null);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSphereColor((prevColor) => (prevColor === "green" ? "red" : "green"));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleLookAt = () => {
    if (sceneRef.current) {
      sceneRef.current.lookAt(new THREE.Vector3(10, 10, 10));
    }
  };

  return (
    <View style={styles.container}>
      <Canvas onPointerMissed={handleCanvasClick} style={styles.canvas}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />

        <Suspense fallback={null}>
          <Environment preset="city" />
          <Model onSceneLoaded={(scene) => (sceneRef.current = scene)} />

          <Sphere
            position={[0, 0.5, 1]}
            onClick={(e) =>
              handleSphereClick(e, "Interactive Point 1", [1, 1.2, 1])
            }
            color={sphereColor}
          />
          <Sphere
            position={[-1, 0.5, -1]}
            onClick={(e) =>
              handleSphereClick(e, "Interactive Point 2", [-1, 0.7, -1])
            }
            color={sphereColor}
          />

          {tooltip && (
            <PositionTracker
              position={tooltip.position}
              onUpdate={setScreenPosition}
            />
          )}
        </Suspense>

        <OrbitControls makeDefault />
      </Canvas>

      {tooltip && screenPosition && (
        <TooltipOverlay text={tooltip.text} position={screenPosition} />
      )}

      <View style={styles.buttonContainer}>
        <Button title="Look At Point" onPress={handleLookAt} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  canvas: {
    flex: 1,
  },
  tooltipContainer: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -75 }, { translateY: -45 }], // Half of tooltip width and height
    pointerEvents: "none", // Allows clicking through the tooltip
  },
  tooltipBubble: {
    backgroundColor: "rgba(42, 42, 42, 0.9)",
    borderRadius: 8,
    padding: 10,
    width: 150,
    alignItems: "center",
  },
  tooltipText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(42, 42, 42, 0.9)",
    alignSelf: "center",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
});

export default ThreeScene;
