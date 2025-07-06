from flask import Blueprint, jsonify, request
from src.models.user import User, Artwork, db
from flask_cors import cross_origin

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
@cross_origin()
def get_users():
    """Get all users with their artwork counts."""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/wallet/<wallet_address>', methods=['GET'])
@cross_origin()
def get_user_by_wallet(wallet_address):
    """Get user by wallet address."""
    user = User.query.filter_by(wallet_address=wallet_address).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@user_bp.route('/users/connect', methods=['POST'])
@cross_origin()
def connect_wallet():
    """Connect wallet and create/get user."""
    data = request.json
    wallet_address = data.get('wallet_address')
    
    if not wallet_address:
        return jsonify({'error': 'Wallet address is required'}), 400
    
    # Check if user already exists
    user = User.query.filter_by(wallet_address=wallet_address).first()
    
    if user:
        return jsonify({
            'message': 'Wallet connected successfully',
            'user': user.to_dict(),
            'is_new_user': False
        })
    
    # Create new user
    user = User(wallet_address=wallet_address)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'New user created successfully',
        'user': user.to_dict(),
        'is_new_user': True
    }), 201

@user_bp.route('/users/<int:user_id>/profile', methods=['PUT'])
@cross_origin()
def update_profile(user_id):
    """Update user profile information."""
    user = User.query.get_or_404(user_id)
    data = request.json
    
    # Update profile fields
    if 'username' in data:
        # Check if username is already taken
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Username already taken'}), 400
        user.username = data['username']
    
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    
    if 'bio' in data:
        user.bio = data['bio']
    
    if 'x_handle' in data:
        user.x_handle = data['x_handle']
    
    if 'discord_handle' in data:
        user.discord_handle = data['discord_handle']
    
    db.session.commit()
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    })

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@cross_origin()
def get_user(user_id):
    """Get user by ID with their artworks."""
    user = User.query.get_or_404(user_id)
    user_data = user.to_dict()
    
    # Include user's artworks
    artworks = Artwork.query.filter_by(user_id=user_id).order_by(Artwork.created_at.desc()).all()
    user_data['artworks'] = [artwork.to_dict() for artwork in artworks]
    
    return jsonify(user_data)

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@cross_origin()
def delete_user(user_id):
    """Delete user and all their artworks."""
    user = User.query.get_or_404(user_id)
    
    # Note: In a real application, you might want to keep the artworks
    # since they're permanently stored on Irys, but remove the user's association
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

@user_bp.route('/users/check-username/<username>', methods=['GET'])
@cross_origin()
def check_username(username):
    """Check if username is available."""
    user = User.query.filter_by(username=username).first()
    return jsonify({
        'available': user is None,
        'username': username
    })

