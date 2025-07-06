from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_address = db.Column(db.String(44), unique=True, nullable=False)  # Solana wallet address
    username = db.Column(db.String(80), unique=True, nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    x_handle = db.Column(db.String(80), nullable=True)  # Twitter/X handle
    discord_handle = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with artworks
    artworks = db.relationship('Artwork', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username or self.wallet_address}>'

    def to_dict(self):
        return {
            'id': self.id,
            'wallet_address': self.wallet_address,
            'username': self.username,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'x_handle': self.x_handle,
            'discord_handle': self.discord_handle,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'artwork_count': len(self.artworks)
        }

class Artwork(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    file_type = db.Column(db.String(20), nullable=False)  # 'image' or 'video'
    irys_id = db.Column(db.String(100), unique=True, nullable=False)  # Irys transaction ID
    file_url = db.Column(db.String(255), nullable=False)  # URL to access file from Irys
    thumbnail_url = db.Column(db.String(255), nullable=True)  # Thumbnail URL
    file_size = db.Column(db.Integer, nullable=True)  # File size in bytes
    mime_type = db.Column(db.String(100), nullable=True)  # MIME type
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Engagement metrics
    views = db.Column(db.Integer, default=0)
    likes = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<Artwork {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'file_type': self.file_type,
            'irys_id': self.irys_id,
            'file_url': self.file_url,
            'thumbnail_url': self.thumbnail_url,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'views': self.views,
            'likes': self.likes,
            'artist': self.user.username or self.user.wallet_address[:8] + '...' if self.user else 'Unknown'
        }

