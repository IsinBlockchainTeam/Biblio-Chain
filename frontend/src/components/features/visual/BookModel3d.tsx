import { useRef, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls, Environment, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import styles from './styles/BookModel3d.module.css';

interface ModelProps {
    position?: [number, number, number];
    scale?: number;
}

/**
 * Model component
 * Loads and animates the 3D book model using GLTFLoader
 */
function Model(props: ModelProps) {
    const group = useRef<THREE.Group>(null);
    const gltf = useLoader(GLTFLoader, '/models/book.glb');
    const { scene, animations } = gltf;
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (animations && animations.length > 0) {
            const animationName = animations[0].name;
            if (actions[animationName]) {
                actions[animationName].setLoop(THREE.LoopOnce, 1);
                actions[animationName].clampWhenFinished = true;
                actions[animationName].reset().play();
            }
        }
    }, [actions, animations]);

    return (
        <group ref={group} position={props.position}>
            <primitive object={scene} scale={props.scale || 1} />
        </group>
    );
}

/**
 * BookModel3D component
 * Renders the animated 3D book model in a WebGL canvas
 */
export default function BookModel3D() {
    return (
        <div className={styles.modelContainer}>
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ width: '100%', height: '100%' }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />
                <Model position={[0, -1, 0]} scale={1.5} />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={false}
                    minPolarAngle={Math.PI / 2.5}
                    maxPolarAngle={Math.PI / 1.5}
                />
                <Environment preset="sunset" />
            </Canvas>
        </div>
    );
}
