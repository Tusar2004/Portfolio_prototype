// src/StartScreen.tsx
import { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ============================================
// CAMERA CONTROLLER
// ============================================
function CameraController() {
  const { camera } = useThree();
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.1) * 0.5;
    camera.position.y = Math.cos(t * 0.15) * 0.3;
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

// ============================================
// ADVANCED 3D ROCKET
// ============================================
function RocketModel() {
  const rocketRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Group>(null);
  const exhaustRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  const exhaustParticles = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = -2.5 - Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.03;
      velocities[i * 3 + 1] = -0.1 - Math.random() * 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
      
      lifetimes[i] = Math.random();
    }
    
    return { positions, velocities, lifetimes };
  }, []);
  
  useFrame((state, delta) => {
    if (!rocketRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // Smooth floating animation
    rocketRef.current.position.y = Math.sin(t * 0.5) * 0.5 + Math.cos(t * 0.3) * 0.2;
    rocketRef.current.rotation.y = Math.sin(t * 0.4) * 0.2;
    rocketRef.current.rotation.z = Math.cos(t * 0.5) * 0.1;
    rocketRef.current.rotation.x = Math.sin(t * 0.3) * 0.05;
    
    // Flame animation
    if (flameRef.current) {
      flameRef.current.children.forEach((child, idx) => {
        if (child instanceof THREE.Mesh) {
          const scale = 1 + Math.sin(t * 15 + idx) * 0.4;
          child.scale.set(1, scale, 1);
          child.material.opacity = 0.6 + Math.sin(t * 20 + idx * 2) * 0.3;
        }
      });
    }
    
    // Exhaust particles
    if (exhaustRef.current) {
      const positions = exhaustRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += exhaustParticles.velocities[i] * delta * 60;
        positions[i + 1] += exhaustParticles.velocities[i + 1] * delta * 60;
        positions[i + 2] += exhaustParticles.velocities[i + 2] * delta * 60;
        
        exhaustParticles.lifetimes[i / 3] -= delta * 0.5;
        
        if (exhaustParticles.lifetimes[i / 3] <= 0 || positions[i + 1] < -6) {
          positions[i] = (Math.random() - 0.5) * 0.4;
          positions[i + 1] = -2.5;
          positions[i + 2] = (Math.random() - 0.5) * 0.4;
          exhaustParticles.lifetimes[i / 3] = 1;
        }
      }
      
      exhaustRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Pulsing glow
    if (glowRef.current) {
      const glowScale = 1 + Math.sin(t * 3) * 0.15;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
    }
  });
  
  return (
    <group ref={rocketRef} position={[0, 0, 0]}>
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Main Rocket Body - Metallic with panels */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 3.5, 32]} />
        <meshStandardMaterial
          color="#1a2332"
          metalness={0.95}
          roughness={0.15}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Body Panels */}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh
            key={`panel-${i}`}
            position={[Math.cos(rad) * 0.52, 0, Math.sin(rad) * 0.52]}
            rotation={[0, rad, 0]}
            castShadow
          >
            <boxGeometry args={[0.12, 3, 0.05]} />
            <meshStandardMaterial
              color="#0ea5e9"
              metalness={1}
              roughness={0.1}
              emissive="#0ea5e9"
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
      
      {/* Nose Cone - Sharp */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <coneGeometry args={[0.5, 1, 32]} />
        <meshStandardMaterial
          color="#0ea5e9"
          metalness={0.9}
          roughness={0.05}
          emissive="#0ea5e9"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Nose Tip Glow */}
      <mesh position={[0, 2.7, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#00ffff" />
        <pointLight color="#00ffff" intensity={3} distance={6} />
      </mesh>
      
      {/* Command Module Windows */}
      {[1, 0.4, -0.2].map((y, i) => (
        <group key={`window-${i}`}>
          <mesh position={[0, y, 0.52]} rotation={[0, 0, 0]}>
            <circleGeometry args={[0.2, 32]} />
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#00d4ff"
              emissiveIntensity={2}
              metalness={0.3}
              roughness={0}
            />
          </mesh>
          <pointLight
            position={[0, y, 0.6]}
            color="#00d4ff"
            intensity={1.2}
            distance={4}
          />
          {/* Window glow rings */}
          <mesh position={[0, y, 0.53]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.2, 0.25, 32]} />
            <meshBasicMaterial
              color="#00d4ff"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
      
      {/* Tech Rings */}
      {[1.3, 0.6, -0.4, -1.2].map((y, i) => (
        <mesh key={`ring-${i}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.05, 16, 64]} />
          <meshStandardMaterial
            color="#00d4ff"
            metalness={1}
            roughness={0}
            emissive="#00d4ff"
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
      
      {/* Landing Fins - Large and prominent */}
      {[0, 120, 240].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <group key={`fin-${i}`}>
            <mesh
              position={[
                Math.cos(rad) * 0.55,
                -1.4,
                Math.sin(rad) * 0.55
              ]}
              rotation={[0, rad, 0]}
              castShadow
            >
              <boxGeometry args={[0.1, 1.2, 0.8]} />
              <meshStandardMaterial
                color="#0ea5e9"
                metalness={0.98}
                roughness={0.05}
                emissive="#0ea5e9"
                emissiveIntensity={0.6}
              />
            </mesh>
            {/* Fin edge lights */}
            <mesh
              position={[
                Math.cos(rad) * 0.55,
                -1.4,
                Math.sin(rad) * 0.95
              ]}
              rotation={[0, rad, 0]}
            >
              <boxGeometry args={[0.05, 1.2, 0.02]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          </group>
        );
      })}
      
      {/* Engine Section */}
      <mesh position={[0, -2, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.4, 0.7, 32]} />
        <meshStandardMaterial
          color="#0f1419"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
      
      {/* Engine Nozzle */}
      <mesh position={[0, -2.3, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.3, 0.4, 32, 1, true]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.95}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Engine Core Glow */}
      <mesh position={[0, -2.4, 0]}>
        <cylinderGeometry args={[0.35, 0.25, 0.3, 32]} />
        <meshBasicMaterial
          color="#ff6b35"
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Rocket Flames */}
      <group ref={flameRef} position={[0, -2.6, 0]}>
        {/* Main flame */}
        <mesh>
          <coneGeometry args={[0.4, 1.5, 16]} />
          <meshBasicMaterial
            color="#ff9500"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* Inner flame */}
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.3, 1.2, 16]} />
          <meshBasicMaterial
            color="#ffff00"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* Core flame */}
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.2, 0.8, 16]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      
      {/* Exhaust Particles */}
      <points ref={exhaustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[exhaustParticles.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          color="#ff9500"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      
      {/* Engine Lights */}
      <pointLight
        position={[0, -2.5, 0]}
        color="#ff9500"
        intensity={5}
        distance={10}
        castShadow
      />
      
      {/* Side accent lights */}
      {[0, 120, 240].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <pointLight
            key={`light-${i}`}
            position={[Math.cos(rad) * 0.6, 0, Math.sin(rad) * 0.6]}
            color="#00d4ff"
            intensity={0.8}
            distance={4}
          />
        );
      })}
    </group>
  );
}

// ============================================
// SPACE ENVIRONMENT
// ============================================
function SpaceEnvironment() {
  const starsRef = useRef<THREE.Points>(null);
  const nebula1Ref = useRef<THREE.Mesh>(null);
  const nebula2Ref = useRef<THREE.Mesh>(null);
  
  const starData = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const radius = 40 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const colorChoice = Math.random();
      if (colorChoice > 0.85) {
        colors[i * 3] = 0.3;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 1.0;
      } else if (colorChoice > 0.7) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.6;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      }
      
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    return { positions, colors, sizes };
  }, []);
  
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.008;
      starsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.002) * 0.05;
    }
    
    if (nebula1Ref.current) {
      nebula1Ref.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
    
    if (nebula2Ref.current) {
      nebula2Ref.current.rotation.z = -state.clock.elapsedTime * 0.015;
    }
  });
  
  return (
    <>
      {/* Stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[starData.colors, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[starData.sizes, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
        />
      </points>
      
      {/* Nebula clouds */}
      <mesh ref={nebula1Ref} position={[-15, 10, -30]}>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial
          color="#4c1d95"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      
      <mesh ref={nebula2Ref} position={[18, -8, -35]}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial
          color="#1e3a8a"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Space fog */}
      <fog attach="fog" args={["#000510", 25, 100]} />
    </>
  );
}

// ============================================
// FLOATING ASTEROIDS
// ============================================
function Asteroids() {
  const groupRef = useRef<THREE.Group>(null);
  
  const asteroidData = useMemo(() => {
    return Array.from({ length: 12 }, () => ({
      position: [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        -20 - Math.random() * 30
      ] as [number, number, number],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 0.5,
      speed: 0.2 + Math.random() * 0.3
    }));
  }, []);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        child.rotation.x += delta * asteroidData[idx].speed;
        child.rotation.y += delta * asteroidData[idx].speed * 0.7;
      });
    }
  });
  
  return (
    <group ref={groupRef}>
      {asteroidData.map((data, i) => (
        <mesh
          key={i}
          position={data.position}
          rotation={data.rotation}
          scale={data.scale}
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.6}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// MAIN START SCREEN
// ============================================
export default function StartScreen({ onStart }: { onStart: () => void }) {
  const [loading, setLoading] = useState(true);
  const [bounce, setBounce] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentProgress = 0;
    const progressSteps = [
      { target: 35, duration: 600 },
      { target: 65, duration: 800 },
      { target: 90, duration: 500 },
      { target: 100, duration: 400 },
    ];

    let stepIndex = 0;
    const animateProgress = () => {
      if (stepIndex >= progressSteps.length) return;
      
      const step = progressSteps[stepIndex];
      const startProgress = currentProgress;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / step.duration, 1);
        
        const easeOutQuad = (t: number) => t * (2 - t);
        currentProgress = startProgress + (step.target - startProgress) * easeOutQuad(progress);
        
        setProgress(Math.floor(currentProgress));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          stepIndex++;
          if (stepIndex < progressSteps.length) {
            setTimeout(animateProgress, 60);
          }
        }
      };
      
      animate();
    };
    
    animateProgress();

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (loading) return;
    
    setBounce(true);
    setTimeout(() => onStart(), 700);
  };

  return (
    <div className="space-start-screen">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        style={{ position: 'absolute', inset: 0 }}
        shadows
      >
        <color attach="background" args={["#000510"]} />
        
        {/* Lighting setup */}
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4c1d95" />
        <pointLight position={[5, 5, 5]} intensity={0.3} color="#0ea5e9" />
        
        <Suspense fallback={null}>
          <CameraController />
          <RocketModel />
          <SpaceEnvironment />
          <Asteroids />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="ui-content">
        {/* Title */}
        <div className="title-wrapper">
          <h1 className="main-title">SPACE PORTFOLIO</h1>
          <div className="title-glow"></div>
        </div>

        {/* Start Button */}
        <div
          className={`start-button-container ${!loading ? "ready" : ""} ${bounce ? "bounce" : ""}`}
          onClick={handleClick}
        >
          <div className="orbit-rings">
            <div className="orbit-ring ring-1"></div>
            <div className="orbit-ring ring-2"></div>
            <div className="orbit-ring ring-3"></div>
          </div>
          
          <div className="button-core">
            {loading ? (
              <>
                <div className="loading-spinner">
                  <div className="spinner-orbit"></div>
                  <div className="spinner-orbit"></div>
                  <div className="spinner-orbit"></div>
                </div>
                <div className="status-text">INITIALIZING</div>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progress}%` }}>
                    <div className="progress-shine"></div>
                  </div>
                </div>
                <div className="progress-value">{progress}%</div>
              </>
            ) : (
              <>
                <div className="launch-icon">🚀</div>
                <div className="launch-text">START JOURNEY</div>
                <div className="launch-subtitle">Click to Launch</div>
                <div className="pulse-wave"></div>
                <div className="pulse-wave" style={{ animationDelay: '1s' }}></div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Indicator */}
        <div className="bottom-indicator">
          <div className="indicator-line"></div>
          <div className="indicator-text">READY FOR LAUNCH</div>
          <div className="indicator-line"></div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .space-start-screen {
          width: 100vw;
          height: 100vh;
          position: relative;
          overflow: hidden;
          background: #000510;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .ui-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 80px 0;
          pointer-events: none;
          z-index: 10;
        }

        /* ===== TITLE ===== */
        .title-wrapper {
          position: relative;
          text-align: center;
          animation: titleEntrance 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes titleEntrance {
          0% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .main-title {
          font-size: 80px;
          font-weight: 900;
          letter-spacing: 16px;
          background: linear-gradient(135deg, #00d4ff 0%, #0ea5e9 30%, #06b6d4 60%, #00d4ff 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientFlow 4s ease infinite;
          position: relative;
          margin: 0;
          text-shadow: 0 0 100px rgba(0, 212, 255, 0.6);
          filter: drop-shadow(0 0 40px rgba(0, 212, 255, 0.4));
        }

        @keyframes gradientFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .title-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.3), transparent 70%);
          filter: blur(40px);
          animation: glowPulse 3s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }

        /* ===== START BUTTON ===== */
        .start-button-container {
          position: relative;
          width: 380px;
          height: 380px;
          pointer-events: auto;
          cursor: pointer;
          animation: buttonEntrance 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s backwards;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes buttonEntrance {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        .start-button-container:hover {
          transform: scale(1.05);
        }

        .start-button-container.ready:hover {
          transform: scale(1.12);
        }

        .start-button-container.bounce {
          animation: buttonBounceOut 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes buttonBounceOut {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.3); }
          60% { transform: scale(0.9); }
        }

        /* ===== ORBIT RINGS ===== */
        .orbit-rings {
          position: absolute;
          inset: 0;
        }

        .orbit-ring {
          position: absolute;
          border: 2px solid transparent;
          border-radius: 50%;
          border-top-color: #0ea5e9;
          border-right-color: #00d4ff;
          animation: ringRotate 4s linear infinite;
        }

        .ring-1 {
          inset: 0;
          opacity: 0.7;
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
        }

        .ring-2 {
          inset: 25px;
          animation-duration: 3s;
          animation-direction: reverse;
          opacity: 0.5;
          border-top-color: #06b6d4;
          border-right-color: #0ea5e9;
          .ring-3 {
  inset: 50px;
  animation-duration: 5s;
  opacity: 0.3;
  border-top-color: #00d4ff;
  border-right-color: #06b6d4;
}

@keyframes ringRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== BUTTON CORE ===== */
.button-core {
  position: absolute;
  inset: 80px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(6, 182, 212, 0.1));
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 0 60px rgba(0, 212, 255, 0.2),
    inset 0 0 40px rgba(0, 212, 255, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.start-button-container.ready .button-core {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(6, 182, 212, 0.2));
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 
    0 0 80px rgba(0, 212, 255, 0.3),
    inset 0 0 60px rgba(0, 212, 255, 0.15);
  animation: coreGlow 2s ease-in-out infinite alternate;
}

@keyframes coreGlow {
  0% { box-shadow: 0 0 80px rgba(0, 212, 255, 0.3), inset 0 0 60px rgba(0, 212, 255, 0.15); }
  100% { box-shadow: 0 0 120px rgba(0, 212, 255, 0.5), inset 0 0 80px rgba(0, 212, 255, 0.25); }
}

/* ===== LOADING STATE ===== */
.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-orbit {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 50%;
  border-top-color: #00d4ff;
  animation: spin 1.5s linear infinite;
}

.spinner-orbit:nth-child(1) {
  inset: 0;
  animation-delay: 0s;
}

.spinner-orbit:nth-child(2) {
  inset: 8px;
  animation-delay: 0.1s;
  animation-duration: 1.2s;
}

.spinner-orbit:nth-child(3) {
  inset: 16px;
  animation-delay: 0.2s;
  animation-duration: 0.9s;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-text {
  color: #00d4ff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.progress-track {
  width: 160px;
  height: 4px;
  background: rgba(0, 212, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #0ea5e9);
  border-radius: 2px;
  position: relative;
  transition: width 0.3s ease;
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shine 1.5s ease-in-out infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.progress-value {
  color: #00d4ff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* ===== READY STATE ===== */
.launch-icon {
  font-size: 48px;
  filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.8));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.launch-text {
  color: #00d4ff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.8);
  animation: textGlow 2s ease-in-out infinite alternate;
}

@keyframes textGlow {
  0% { text-shadow: 0 0 20px rgba(0, 212, 255, 0.8); }
  100% { text-shadow: 0 0 30px rgba(0, 212, 255, 1), 0 0 40px rgba(0, 212, 255, 0.6); }
}

.launch-subtitle {
  color: rgba(0, 212, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.pulse-wave {
  position: absolute;
  inset: -10px;
  border: 2px solid rgba(0, 212, 255, 0.5);
  border-radius: 50%;
  animation: pulse 2s ease-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

/* ===== BOTTOM INDICATOR ===== */
.bottom-indicator {
  display: flex;
  align-items: center;
  gap: 20px;
  color: rgba(0, 212, 255, 0.8);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  animation: fadeInUp 1s ease 1s backwards;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.indicator-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
  position: relative;
}

.indicator-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: #00d4ff;
  border-radius: 50%;
  animation: dotMove 2s ease-in-out infinite;
}

@keyframes dotMove {
  0%, 100% { left: 0; opacity: 0; }
  50% { left: 100%; opacity: 1; }
}

.indicator-text {
  animation: textPulse 3s ease-in-out infinite;
}

@keyframes textPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
  .main-title {
    font-size: 50px;
    letter-spacing: 8px;
  }

  .start-button-container {
    width: 300px;
    height: 300px;
  }

  .button-core {
    inset: 60px;
  }

  .launch-text {
    font-size: 16px;
    letter-spacing: 2px;
  }

  .ui-content {
    padding: 60px 0;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 36px;
    letter-spacing: 4px;
  }

  .start-button-container {
    width: 250px;
    height: 250px;
  }

  .button-core {
    inset: 50px;
    gap: 15px;
  }

  .launch-icon {
    font-size: 36px;
  }

  .launch-text {
    font-size: 14px;
    letter-spacing: 1px;
  }

  .bottom-indicator {
    font-size: 10px;
    letter-spacing: 2px;
  }
}
`}</style>
    </div>
  );
}
