CREATE TABLE `platform_feedback` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int,
  `role` varchar(50),
  `name` varchar(100),
  `answers` json,
  `createdAt` timestamp DEFAULT (now()) NOT NULL
);
