# --- Stage 1: Build Spring Boot JAR bằng Maven & JDK 21 ---
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Tận dụng cache Docker layer cho dependencies
COPY pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copy mã nguồn và đóng gói JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Runtime image (JRE 21 Alpine) ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Tạo user non-root bảo mật
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /build/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 8080

# Tối ưu JVM trong môi trường container
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
