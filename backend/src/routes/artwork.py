from flask import Blueprint, jsonify, request, current_app
from src.models.user import User, Artwork, db
from src.services.irys_service import irys_service
from flask_cors import cross_origin
import os
import magic
from PIL import Image
import io
import base64

artwork_bp = Blueprint('artwork', __name__)

@artwork_bp.route('/artworks', methods=['GET'])
@cross_origin()
def get_artworks():
    """Get all artworks with pagination and filtering."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    file_type = request.args.get('file_type')  # 'image' or 'video'
    search = request.args.get('search')
    user_id = request.args.get('user_id', type=int)
    
    query = Artwork.query
    
    # Apply filters
    if file_type:
        query = query.filter(Artwork.file_type == file_type)
    
    if user_id:
        query = query.filter(Artwork.user_id == user_id)
    
    if search:
        query = query.filter(
            db.or_(
                Artwork.title.contains(search),
                Artwork.description.contains(search)
            )
        )
    
    # Order by creation date (newest first)
    query = query.order_by(Artwork.created_at.desc())
    
    # Paginate
    artworks = query.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    
    return jsonify({
        'artworks': [artwork.to_dict() for artwork in artworks.items],
        'total': artworks.total,
        'pages': artworks.pages,
        'current_page': page,
        'per_page': per_page,
        'has_next': artworks.has_next,
        'has_prev': artworks.has_prev
    })

@artwork_bp.route('/artworks', methods=['POST'])
@cross_origin()
def upload_artwork():
    """Upload new artwork to Irys and save metadata."""
    try:
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description', '')
        user_id = request.form.get('user_id', type=int)
        
        if not title or not user_id:
            return jsonify({'error': 'Title and user_id are required'}), 400
        
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file data
        file_data = file.read()
        file.seek(0)  # Reset file pointer
        
        # Detect MIME type
        mime_type = magic.from_buffer(file_data, mime=True)
        
        # Validate file type
        if not mime_type.startswith(('image/', 'video/')):
            return jsonify({'error': 'Only image and video files are allowed'}), 400
        
        file_type = 'image' if mime_type.startswith('image/') else 'video'
        
        # Prepare tags for Irys
        tags = {
            'Content-Type': mime_type,
            'Title': title,
            'Description': description,
            'Artist': user.username or user.wallet_address,
            'App': 'Irys-Gallery'
        }
        
        # Upload to Irys
        upload_result = irys_service.upload_file(file_data, mime_type, tags)
        
        if not upload_result['success']:
            return jsonify({'error': f'Failed to upload to Irys: {upload_result.get("error")}'}), 500
        
        # Generate thumbnail for images
        thumbnail_url = None
        if file_type == 'image':
            try:
                thumbnail_data = generate_thumbnail(file_data)
                if thumbnail_data:
                    # Upload thumbnail to Irys
                    thumbnail_tags = {
                        'Content-Type': 'image/jpeg',
                        'Title': f'{title} - Thumbnail',
                        'App': 'Irys-Gallery',
                        'Type': 'Thumbnail'
                    }
                    thumbnail_result = irys_service.upload_file(thumbnail_data, 'image/jpeg', thumbnail_tags)
                    if thumbnail_result['success']:
                        thumbnail_url = thumbnail_result['url']
            except Exception as e:
                print(f"Failed to generate thumbnail: {e}")
        
        # Save artwork metadata to database
        artwork = Artwork(
            user_id=user_id,
            title=title,
            description=description,
            file_type=file_type,
            irys_id=upload_result['transaction_id'],
            file_url=upload_result['url'],
            thumbnail_url=thumbnail_url,
            file_size=len(file_data),
            mime_type=mime_type
        )
        
        db.session.add(artwork)
        db.session.commit()
        
        return jsonify({
            'message': 'Artwork uploaded successfully',
            'artwork': artwork.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@artwork_bp.route('/artworks/<int:artwork_id>', methods=['GET'])
@cross_origin()
def get_artwork(artwork_id):
    """Get specific artwork by ID."""
    artwork = Artwork.query.get_or_404(artwork_id)
    
    # Increment view count
    artwork.views += 1
    db.session.commit()
    
    return jsonify(artwork.to_dict())

@artwork_bp.route('/artworks/<int:artwork_id>', methods=['PUT'])
@cross_origin()
def update_artwork(artwork_id):
    """Update artwork metadata."""
    artwork = Artwork.query.get_or_404(artwork_id)
    data = request.json
    
    # Check if user owns this artwork
    user_id = data.get('user_id')
    if user_id != artwork.user_id:
        return jsonify({'error': 'You can only update your own artworks'}), 403
    
    # Update allowed fields
    if 'title' in data:
        artwork.title = data['title']
    
    if 'description' in data:
        artwork.description = data['description']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Artwork updated successfully',
        'artwork': artwork.to_dict()
    })

@artwork_bp.route('/artworks/<int:artwork_id>', methods=['DELETE'])
@cross_origin()
def delete_artwork(artwork_id):
    """Delete artwork metadata (note: file remains on Irys permanently)."""
    artwork = Artwork.query.get_or_404(artwork_id)
    
    # Check if user owns this artwork
    user_id = request.json.get('user_id') if request.json else None
    if user_id != artwork.user_id:
        return jsonify({'error': 'You can only delete your own artworks'}), 403
    
    # Note: The actual file cannot be deleted from Irys as it's permanent storage
    # We only remove the metadata from our database
    db.session.delete(artwork)
    db.session.commit()
    
    return jsonify({
        'message': 'Artwork removed from gallery (file remains permanently stored on Irys)'
    }), 200

@artwork_bp.route('/artworks/<int:artwork_id>/like', methods=['POST'])
@cross_origin()
def like_artwork(artwork_id):
    """Like an artwork (increment like count)."""
    artwork = Artwork.query.get_or_404(artwork_id)
    artwork.likes += 1
    db.session.commit()
    
    return jsonify({
        'message': 'Artwork liked',
        'likes': artwork.likes
    })

def generate_thumbnail(image_data, size=(300, 300)):
    """Generate a thumbnail from image data."""
    try:
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Create thumbnail
        image.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=85)
        return output.getvalue()
        
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return None

